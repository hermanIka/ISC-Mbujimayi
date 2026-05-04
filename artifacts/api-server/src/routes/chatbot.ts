import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, chatMessagesTable } from "@workspace/db";
import { SendChatMessageBody, GetChatHistoryQueryParams } from "@workspace/api-zod";
import { nanoid } from "nanoid";

const router: IRouter = Router();

const FAQ: Record<string, string> = {
  "inscription": "Pour vous inscrire à l'ISC Mbujimayi, vous devez soumettre votre dossier d'inscription via la plateforme. Vous aurez besoin de votre diplôme d'État, d'une photo d'identité et d'une copie de votre carte nationale.",
  "frais": "Les frais académiques varient selon la filière. Veuillez consulter le service financier ou effectuer votre paiement via Mobile Money (MTN, Airtel, Orange).",
  "cours": "Les cours sont disponibles dans l'espace e-learning de la plateforme. Une fois inscrit et votre dossier approuvé, vous aurez accès à tous vos cours.",
  "certificat": "Les certificats de fin de cours sont délivrés automatiquement lorsque vous avez complété 100% d'un cours. Vous pouvez les télécharger depuis votre tableau de bord.",
  "horaire": "Les horaires des cours et des évaluations sont communiqués par vos enseignants via la plateforme. Consultez régulièrement vos cours.",
  "contact": "Pour contacter le service académique, rendez-vous à l'administration de l'ISC Mbujimayi ou envoyez un message via la plateforme.",
};

function findFAQAnswer(message: string): string | null {
  const lower = message.toLowerCase();
  for (const [key, answer] of Object.entries(FAQ)) {
    if (lower.includes(key)) return answer;
  }
  return null;
}

router.post("/chatbot/message", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { message, sessionId } = parsed.data;
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
  let query = db.select().from(chatMessagesTable);
  if (sessionId) query = query.where(eq(chatMessagesTable.sessionId, sessionId)) as any;
  const messages = await query.limit(50);
  res.json(messages);
});

export default router;
