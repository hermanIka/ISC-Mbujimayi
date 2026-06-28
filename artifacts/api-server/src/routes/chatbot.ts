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

interface FAQEntry {
  keywords: string[];
  answer: string;
}

const FAQ_ENTRIES: FAQEntry[] = [
  {
    keywords: ["inscri", "admission", "dossier", "candidat", "entrer", "intégrer", "rejoindre"],
    answer: `Pour vous inscrire à l'ISC Mbujimayi, vous devez constituer un dossier comprenant :
• Diplôme d'État original + 2 photocopies certifiées
• Extrait d'acte de naissance (moins de 3 mois)
• 4 photos d'identité format passeport
• Copie de la carte nationale d'identité
• Attestation de réussite (si disponible)

Le dossier est déposé au Service des Inscriptions (bloc administratif, RDC). Les inscriptions en ligne sont disponibles sur cette plateforme. Frais d'inscription : 25 USD (à régler via Mobile Money).`,
  },
  {
    keywords: ["frais", "minerval", "cout", "coût", "payer", "paiement", "montant", "tarif", "prix", "combien"],
    answer: `Frais académiques ISC Mbujimayi (année 2024–2025) :
• Frais d'inscription (nouveaux) : 25 USD
• Minerval annuel (selon filière) : 150–200 USD
• Frais d'examen par session : 15 USD
• Frais de rattrapage : 10 USD/matière

Paiement via Mobile Money (Vodacom, Airtel, Orange) directement sur la plateforme ou au guichet financier. Un reçu vous est remis automatiquement après chaque paiement.`,
  },
  {
    keywords: ["filiere", "filière", "programme", "formation", "option", "departement", "département", "section"],
    answer: `L'ISC Mbujimayi propose 5 filières réparties en 3 facultés :

📊 Sciences Commerciales et Financières
  • Comptabilité (COMPTA) — Normes OHADA, audit, fiscalité
  • Fiscalité (FISC) — Droit fiscal congolais, fiscalité internationale
  • Marketing (MKT) — Commerce, marketing digital, étude de marché

💻 Informatique de Gestion (INFO)
  • Développement logiciel, bases de données, systèmes d'information

📋 Secrétariat de Direction (SECDIR)
  • Bureautique, correspondance, management de bureau

Durée : 4 ans (Graduat G1–G3 + Licence L1). Diplôme d'État reconnu par le Gouvernement de la RDC.`,
  },
  {
    keywords: ["compta", "comptabilite", "comptabilité", "ohada", "finance", "financier"],
    answer: `La filière Comptabilité (COMPTA) forme des professionnels maîtrisant :
• Plan comptable OHADA (système utilisé dans toute l'Afrique francophone)
• Comptabilité générale, analytique et des sociétés
• Audit et contrôle interne
• Fiscalité des entreprises congolaises
• Gestion financière et tableaux de bord

Débouchés : comptable d'entreprise, auditeur, contrôleur de gestion, directeur financier. Durée : 4 ans.`,
  },
  {
    keywords: ["marketing", "mkt", "commerce", "commercial", "vente", "marche", "marché"],
    answer: `La filière Marketing (MKT) couvre :
• Fondamentaux du marketing et stratégie commerciale
• Marketing digital et réseaux sociaux
• Étude de marché et comportement du consommateur
• Gestion des ventes et techniques de négociation
• Commerce international

Débouchés : chargé de marketing, commercial, chef de produit, consultant. Durée : 4 ans.`,
  },
  {
    keywords: ["informatique", "info", "programmation", "developpement", "développement", "logiciel", "base de donnee", "base de données", "systeme", "système"],
    answer: `La filière Informatique de Gestion (INFO) forme des informaticiens orientés gestion :
• Développement web et applications de gestion
• Bases de données (SQL, conception)
• Systèmes d'information en entreprise
• Réseaux informatiques et sécurité
• Gestion de projets informatiques

Débouchés : développeur, administrateur systèmes, analyste informatique. Durée : 4 ans.`,
  },
  {
    keywords: ["fiscalite", "fiscalité", "fisc", "impot", "impôt", "taxe", "droit fiscal"],
    answer: `La filière Fiscalité (FISC) forme des experts en droit fiscal :
• Droit fiscal congolais (DGI, DGRAD, OCC)
• Fiscalité des entreprises et des particuliers
• Droit fiscal international et conventions
• Procédures fiscales et contentieux
• Comptabilité fiscale

Débouchés : inspecteur fiscal, conseiller fiscal, directeur administratif et financier. Durée : 4 ans.`,
  },
  {
    keywords: ["secretariat", "secrétariat", "secdir", "secretaire", "secrétaire", "bureautique", "bureau"],
    answer: `La filière Secrétariat de Direction (SECDIR) forme des assistants de direction :
• Techniques de secrétariat et gestion documentaire
• Bureautique avancée (Word, Excel, PowerPoint)
• Correspondance professionnelle et protocole
• Management de bureau et organisation
• Communication en entreprise

Débouchés : secrétaire de direction, assistante administrative, office manager. Durée : 4 ans.`,
  },
  {
    keywords: ["cours", "elearning", "e-learning", "lecon", "leçon", "chapitre", "module", "acceder", "accéder", "plateforme", "contenu"],
    answer: `Les cours e-learning de l'ISC Mbujimayi sont accessibles depuis votre tableau de bord étudiant. Chaque cours contient :
• Des modules thématiques
• Des chapitres avec contenu vidéo/texte
• Des exercices pratiques
• Une évaluation finale certificative

Accès : connectez-vous → "Mes cours". Vos cours s'affichent après approbation de votre dossier par le Service Académique. Connexion 24h/24 depuis tout appareil.`,
  },
  {
    keywords: ["certificat", "attestation", "diplome", "diplôme", "fin de cours", "valider", "validation"],
    answer: `Les certificats ISC Mbujimayi sont délivrés automatiquement :
• Certificat de cours : téléchargeable dès 100% d'un cours complété (PDF officiel avec QR code)
• Attestation de réussite annuelle : délivrée par le Service Académique après délibérations
• Diplôme d'État : remis lors de la cérémonie de proclamation officielle

Téléchargez vos certificats depuis : Tableau de bord → "Mes certificats".`,
  },
  {
    keywords: ["paiement", "mobile money", "mtn", "airtel", "orange", "money", "transaction", "recharge", "virement"],
    answer: `Paiements Mobile Money disponibles sur la plateforme :
• 📱 Vodacom Money : *400# → "M-Pesa Paiement"
• 📱 Airtel Money : *185# → "Paiement"
• 📱 Orange Money : *144# → "Paiement marchand"

Pour payer en ligne : connectez-vous → "Paiements" → choisissez le type (inscription, minerval, examen) → sélectionnez votre opérateur → confirmez avec votre code PIN. Un SMS de confirmation est envoyé immédiatement.`,
  },
  {
    keywords: ["contact", "telephone", "téléphone", "email", "adresse", "localisation", "trouver", "où", "emplacement"],
    answer: `Coordonnées ISC Mbujimayi :

📍 Adresse : Avenue Kabinda, Quartier Muya, Mbujimayi, Kasaï-Oriental, RDC
📞 Secrétariat : +243 97 000 0000
📞 Service Académique : +243 98 000 0000
📞 Service Financier : +243 99 000 0000
📧 Email : info@isc-mbujimayi.cd
🕐 Heures : Lundi–Vendredi 07h30–16h30, Samedi 08h00–12h00

Pour des questions urgentes, utilisez la messagerie de la plateforme (Tableau de bord → "Messages").`,
  },
  {
    keywords: ["horaire", "emploi du temps", "calendrier", "examen", "session", "deliberation", "délibération", "planning"],
    answer: `Calendrier académique ISC Mbujimayi 2024–2025 :
• 1ère session : Octobre – Janvier (examens : Janvier–Février)
• 2ème session : Février – Juin (examens : Juin–Juillet)
• Session de rattrapage : Août–Septembre

Les emplois du temps détaillés sont publiés sur la plateforme et affichés au tableau des annonces. Consultez votre cours → "Calendrier" pour les dates d'examen par matière.`,
  },
  {
    keywords: ["resultat", "résultat", "note", "delibere", "délibéré", "cote", "côte", "score", "reussir", "réussir"],
    answer: `Résultats et délibérations :
• Les résultats sont publiés sur la plateforme après chaque session de délibération
• Accès : Tableau de bord → "Mes résultats"
• Note de passage : 60% (12/20) par matière
• En cas d'échec : possibilité de rattrapage à la session de septembre
• Contestation de notes : formulaire disponible au Service Académique dans les 5 jours suivant la publication`,
  },
  {
    keywords: ["mot de passe", "mot de passe", "connexion", "connecter", "compte", "identifiant", "login", "oublié", "oublie", "réinitialiser", "reinitialiser"],
    answer: `Problème de connexion à votre compte :
• Mot de passe oublié : cliquez "Connexion" → "Mot de passe oublié" → entrez votre email ISC
• Compte bloqué : contactez le Service Académique (votre compte peut être suspendu en cas de frais impayés)
• Nouveau compte : l'accès est créé lors de votre inscription et validé dans les 48h
• Assistance technique : envoyez un email à support@isc-mbujimayi.cd en précisant votre matricule`,
  },
  {
    keywords: ["bourse", "aide", "financier", "subvention", "reduction", "réduction", "exoneration", "exonération"],
    answer: `Aides financières à l'ISC Mbujimayi :
• Bourses d'excellence : accordées aux étudiants classés 1er de leur promotion (réduction 50% du minerval)
• Facilités de paiement : paiement du minerval en 3 tranches (renseignez-vous au Service Financier)
• Bourses gouvernementales : l'ISC peut relayer les appels à candidatures du MINESU (Ministère de l'Enseignement Supérieur)

Renseignez-vous directement au Service Financier avec votre dossier académique.`,
  },
];

function findFAQEntries(message: string): FAQEntry[] {
  const lower = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return FAQ_ENTRIES.filter((entry) =>
    entry.keywords.some((kw) => {
      const normalizedKw = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return lower.includes(normalizedKw);
    })
  );
}

const ISC_SYSTEM_PROMPT = `Tu es l'assistant académique virtuel officiel de l'Institut Supérieur de Commerce (ISC) Mbujimayi, en République Démocratique du Congo (province du Kasaï-Oriental).

Ton rôle est d'aider les étudiants, enseignants et visiteurs avec toutes leurs questions sur l'institution, les inscriptions, les programmes, les paiements et la vie académique.

INFORMATIONS OFFICIELLES ISC MBUJIMAYI :
- 5 filières : Comptabilité (COMPTA), Fiscalité (FISC), Marketing (MKT), Informatique de Gestion (INFO), Secrétariat de Direction (SECDIR)
- 3 facultés : Sciences Commerciales et Financières | Informatique de Gestion | Secrétariat de Direction
- Durée des études : 4 ans (G1, G2, G3 = Graduat ; L1 = Licence)
- Frais d'inscription : 25 USD | Minerval annuel : 150–200 USD | Frais d'examen : 15 USD
- Paiements : Vodacom Money (*400#), Airtel Money (*185#), Orange Money (*144#)
- Adresse : Avenue Kabinda, Quartier Muya, Mbujimayi, Kasaï-Oriental, RDC
- Contact : +243 97 000 0000 (secrétariat) | info@isc-mbujimayi.cd
- Dossier d'inscription requis : Diplôme d'État + acte de naissance + photos d'identité + carte nationale
- Certificats de cours téléchargeables sur la plateforme (100% cours complété)
- Calendrier : 2 sessions par an + session de rattrapage (août–septembre)
- Note de passage : 60% (12/20) par matière

Règles de réponse :
- Réponds TOUJOURS en français (ou en anglais si la question est posée en anglais)
- Sois concis, précis, bienveillant et professionnel
- Si tu ne sais pas quelque chose, oriente vers le Service Académique ou le Secrétariat
- Ne pas inventer de montants, dates ou informations non mentionnées ci-dessus`;


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

  const faqMatches = isEscalationControl ? [] : findFAQEntries(message);
  const faqAnswer = faqMatches.length > 0
    ? faqMatches.map((e) => e.answer).join("\n\n---\n\n")
    : null;

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
