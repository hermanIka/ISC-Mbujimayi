import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, chatMessagesTable } from "@workspace/db";
import { SendChatMessageBody, GetChatHistoryQueryParams } from "@workspace/api-zod";
import { nanoid } from "nanoid";
import { getCallerDbUser } from "../middlewares/auth";

const router: IRouter = Router();

const FAQ: Record<string, string> = {
  "inscription": "Pour vous inscrire à l'ISC Mbujimayi, vous devez soumettre votre dossier d'inscription via la plateforme. Vous aurez besoin de votre diplôme d'État, d'une photo d'identité et d'une copie de votre carte nationale.",
  "frais": "Les frais académiques varient selon la filière. Veuillez consulter le service financier ou effectuer votre paiement via Mobile Money (MTN, Airtel, Orange).",
  "minerval": "Le minerval est réglé via Mobile Money (Orange Money, Airtel Money, M-Pesa) directement sur la plateforme. Contactez le service financier pour connaître le montant de votre filière.",
  "cours": "Les cours sont disponibles dans l'espace e-learning de la plateforme. Une fois inscrit et votre dossier approuvé, vous aurez accès à tous vos cours.",
  "certificat": "Les certificats de fin de cours sont délivrés automatiquement lorsque vous avez complété 100% d'un cours. Vous pouvez les télécharger depuis votre tableau de bord.",
  "horaire": "Les horaires des cours et des évaluations sont communiqués par vos enseignants via la plateforme. Consultez régulièrement vos cours.",
  "contact": "Pour contacter le service académique, rendez-vous à l'administration de l'ISC Mbujimayi ou envoyez un message via la plateforme. Tel: +243 99 000 0000.",
  "filiere": "L'ISC Mbujimayi propose 5 filières : Comptabilité, Marketing, Informatique de Gestion, GRH et Fiscalité. Durée : 3 ans (Licence).",
  "diplome": "L'ISC Mbujimayi délivre des diplômes d'État reconnus par le Gouvernement de la République Démocratique du Congo.",
};

function findFAQAnswer(message: string): string | null {
  const lower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, answer] of Object.entries(FAQ)) {
    const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower.includes(normalizedKey)) return answer;
  }
  return null;
}

function isAuthSession(sessionId: string): boolean {
  return sessionId.startsWith("user-");
}

function extractUserIdFromSession(sessionId: string): string | null {
  if (!sessionId.startsWith("user-")) return null;
  return sessionId.slice("user-".length);
}

router.post("/chatbot/message", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { message, sessionId } = parsed.data;

  if (isAuthSession(sessionId)) {
    const callerUser = await getCallerDbUser(req);
    const expectedUserId = extractUserIdFromSession(sessionId);
    if (!callerUser || callerUser.clerkId !== expectedUserId) {
      res.status(403).json({ error: "Session ID does not match authenticated user" });
      return;
    }
  }

  await db.insert(chatMessagesTable).values({
    id: nanoid(),
    role: "user",
    content: message,
    usedAI: false,
    sessionId,
  });

  const faqAnswer = findFAQAnswer(message);
  const reply = faqAnswer ??
    "Bonjour ! Je suis l'assistant virtuel de l'ISC Mbujimayi. Je peux vous aider avec les inscriptions, les frais académiques, l'accès aux cours et les certificats. Comment puis-je vous aider ?";

  await db.insert(chatMessagesTable).values({
    id: nanoid(),
    role: "assistant",
    content: reply,
    usedAI: false,
    sessionId,
  });

  res.json({ reply, usedAI: false, sessionId });
});

router.get("/chatbot/history", async (req, res): Promise<void> => {
  const params = GetChatHistoryQueryParams.safeParse(req.query);
  const sessionId = params.data?.sessionId;

  if (sessionId && isAuthSession(sessionId)) {
    const callerUser = await getCallerDbUser(req);
    const expectedUserId = extractUserIdFromSession(sessionId);
    if (!callerUser || callerUser.clerkId !== expectedUserId) {
      res.status(403).json({ error: "Cannot access chat history for this session" });
      return;
    }
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(sessionId ? eq(chatMessagesTable.sessionId, sessionId) : undefined)
    .limit(100);

  res.json(messages);
});

export default router;
