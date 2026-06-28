import { Router, type IRouter } from "express";
import { db, usersTable, studentsTable, paymentsTable, inscriptionsTable, filieresTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "../lib/logger";
import { sendEmail, buildInscriptionReceivedEmail } from "../lib/emailService";

const router: IRouter = Router();

const VALID_OPERATORS = ["VODACOM_MONEY", "AIRTEL_MONEY", "ORANGE_MONEY"] as const;
type MobileOperator = typeof VALID_OPERATORS[number];

router.post("/pre-register", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
  const filiereId = typeof body.filiereId === "string" ? body.filiereId.trim() : undefined;
  const operator = (VALID_OPERATORS as readonly string[]).includes(body.operator as string)
    ? (body.operator as MobileOperator)
    : null;
  const operatorRef = typeof body.operatorRef === "string" ? body.operatorRef.trim() : "";
  const paymentPhone = typeof body.paymentPhone === "string" ? body.paymentPhone.trim() : "";
  const documents = Array.isArray(body.documents) ? (body.documents as Array<Record<string, string>>) : [];

  if (!firstName || !lastName || !email.includes("@") || !operator || !operatorRef || !paymentPhone) {
    res.status(400).json({ error: "Champs requis manquants ou invalides." });
    return;
  }

  try {
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existingUser.length > 0) {
      res.status(409).json({ error: "Un compte avec cet email existe déjà." });
      return;
    }

    const userId = nanoid();
    const tempClerkId = `PREREG_${nanoid()}`;
    const studentId = nanoid();
    const paymentId = nanoid();
    const inscriptionId = nanoid();
    const reference = `ISC-INSCR-${Date.now()}-${nanoid(6).toUpperCase()}`;
    const numEtudiant = `ISC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    await db.insert(usersTable).values({
      id: userId,
      clerkId: tempClerkId,
      email,
      firstName,
      lastName,
      role: "STUDENT",
      isActive: true,
    });

    await db.insert(studentsTable).values({
      id: studentId,
      userId,
      firstName,
      lastName,
      phone: phone ?? null,
      numEtudiant,
      filiereId: filiereId ?? null,
    });

    const serializedDocs = (documents ?? []).map((d) => ({
      type: d.type,
      name: d.name,
      url: d.url ?? "",
      uploadedAt: d.uploadedAt,
    }));

    await db.insert(paymentsTable).values({
      id: paymentId,
      studentId,
      amount: "15000",
      currency: "CDF",
      type: "INSCRIPTION_FEE",
      operator,
      phoneNumber: paymentPhone,
      status: "CONFIRMED",
      reference,
      operatorRef,
    });

    await db.insert(inscriptionsTable).values({
      id: inscriptionId,
      studentId,
      status: "UNDER_REVIEW",
      documents: serializedDocs,
    });

    let filiereName: string | null = null;
    if (filiereId) {
      const [fil] = await db.select().from(filieresTable).where(eq(filieresTable.id, filiereId)).limit(1);
      filiereName = fil?.name ?? null;
    }

    const studentName = `${firstName} ${lastName}`.trim();
    const { subject, html } = buildInscriptionReceivedEmail({
      studentName,
      filiereName,
      reference,
      operatorRef,
      amount: "15000",
      currency: "CDF",
      operator,
    });

    await sendEmail({ to: email, subject, html });

    logger.info(
      { userId, studentId, inscriptionId, paymentId, reference },
      "✅ [PRE-REGISTER] Dossier étudiant créé — paiement CONFIRMED, inscription UNDER_REVIEW, email envoyé",
    );

    res.status(201).json({
      userId,
      studentId,
      inscriptionId,
      paymentId,
      reference,
      numEtudiant,
      message: "Dossier enregistré avec succès. Votre candidature est en cours d'examen.",
    });
  } catch (err) {
    logger.error({ err }, "❌ [PRE-REGISTER] Erreur lors de la création du dossier étudiant");
    res.status(500).json({ error: "Une erreur est survenue lors de l'enregistrement de votre dossier." });
  }
});

router.post("/pre-register/link-clerk", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const clerkId = typeof body.clerkId === "string" ? body.clerkId.trim() : "";
  if (!email.includes("@") || !clerkId) {
    res.status(400).json({ error: "email et clerkId requis" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(404).json({ error: "Utilisateur non trouvé" });
    return;
  }

  if (!user.clerkId.startsWith("PREREG_")) {
    res.status(200).json({ message: "Compte déjà lié", userId: user.id });
    return;
  }

  await db.update(usersTable).set({ clerkId }).where(eq(usersTable.id, user.id));
  logger.info({ userId: user.id, clerkId }, "🔗 [PRE-REGISTER] clerkId lié au compte pré-enregistré");
  res.status(200).json({ message: "Compte lié avec succès", userId: user.id });
});

export default router;
