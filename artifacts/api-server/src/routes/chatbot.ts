import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, chatMessagesTable } from "@workspace/db";
import { SendChatMessageBody, GetChatHistoryQueryParams } from "@workspace/api-zod";
import { nanoid } from "nanoid";
import { getCallerDbUser } from "../middlewares/auth";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
});

const FAQ: Record<string, string> = {
  inscription: "Pour vous inscrire à l'ISC Mbujimayi, vous devez soumettre votre dossier d'inscription via la plateforme. Vous aurez besoin de votre diplôme d'État, d'une photo d'identité et d'une copie de votre carte nationale.",
  frais: "Les frais académiques varient selon la filière. Veuillez consulter le service financier ou effectuer votre paiement via Mobile Money (MTN, Airtel, Orange).",
  minerval: "Le minerval est réglé via Mobile Money (MTN Mobile Money, Airtel Money, Orange Money) directement sur la plateforme. Contactez le service financier pour connaître le montant de votre filière.",
  cours: "Les cours sont disponibles dans l'espace e-learning de la plateforme. Une fois inscrit et votre dossier approuvé, vous aurez accès à tous vos cours.",
  certificat: "Les certificats de fin de cours sont délivrés automatiquement lorsque vous avez complété 100% d'un cours. Vous pouvez les télécharger depuis votre tableau de bord.",
  horaire: "Les horaires des cours et des évaluations sont communiqués par vos enseignants via la plateforme. Consultez régulièrement vos cours.",
  contact: "Pour contacter le service académique, rendez-vous à l'administration de l'ISC Mbujimayi ou envoyez un message via la plateforme. Tel: +243 99 000 0000.",
  filiere: "L'ISC Mbujimayi propose 5 filières : Comptabilité, Marketing, Informatique de Gestion, GRH et Fiscalité. Durée : 3 ans (Licence).",
  diplome: "L'ISC Mbujimayi délivre des diplômes d'État reconnus par le Gouvernement de la République Démocratique du Congo.",
};

const ISC_SYSTEM_PROMPT = `Tu es un assistant académique virtuel de l'Institut Supérieur de Commerce (ISC) Mbujimayi, en République Démocratique du Congo.
Ton rôle est d'aider les étudiants, enseignants et visiteurs avec des questions sur l'institution, les inscriptions, les programmes de formation, les paiements et la vie académique.
Réponds toujours en français (ou en anglais si la question est en anglais). Sois concis, précis et bienveillant.
Informations clés : 5 filières (Comptabilité, Marketing, Informatique de Gestion, GRH, Fiscalité), paiements via MTN Mobile Money / Airtel Money / Orange Money.`;

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

async function callOpenAI(userMessage: string, history: Array<{ role: string; content: string }>): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: ISC_SYSTEM_PROMPT },
    ...history.slice(-6).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 512,
    messages,
  });

  return response.choices[0]?.message?.content ?? "Désolé, je n'ai pas pu générer une réponse. Veuillez réessayer.";
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

  const isEscalationControl = message.startsWith("__escalate__:");
  const cleanedMessage = isEscalationControl ? message.slice("__escalate__:".length).trim() : message;

  await db.insert(chatMessagesTable).values({
    id: nanoid(),
    role: "user",
    content: cleanedMessage,
    usedAI: false,
    sessionId,
  });

  const faqAnswer = isEscalationControl ? null : findFAQAnswer(message);

  let reply: string;
  let usedAI = false;
  let escalated = false;

  if (faqAnswer) {
    reply = faqAnswer;
  } else {
    const isEscalationConfirm = /\b(oui|yes|transmettre|escalate|escalader|confirmer?|ok)\b/i.test(cleanedMessage);

    if (isEscalationControl || isEscalationConfirm) {
      const actualMessage = cleanedMessage;
      const history = await db
        .select()
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.sessionId, sessionId))
        .limit(10);
      try {
        reply = await callOpenAI(actualMessage, history);
        usedAI = true;
        escalated = true;
      } catch {
        reply = "Je n'ai pas pu contacter le conseiller IA pour le moment. Veuillez réessayer dans quelques instants ou contacter directement l'administration.";
      }
    } else {
      reply = "__ESCALATE_PROMPT__";
      escalated = false;
    }
  }

  if (reply !== "__ESCALATE_PROMPT__") {
    await db.insert(chatMessagesTable).values({
      id: nanoid(),
      role: "assistant",
      content: reply,
      usedAI,
      sessionId,
    });
  }

  res.json({ reply, usedAI, escalated, sessionId, needsEscalationConfirm: reply === "__ESCALATE_PROMPT__" });
});

router.get("/chatbot/history", async (req, res): Promise<void> => {
  const params = GetChatHistoryQueryParams.safeParse(req.query);
  const sessionId = params.data?.sessionId;

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  if (isAuthSession(sessionId)) {
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
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .limit(50);

  res.json(messages);
});

export default router;
