import { Router, type IRouter } from "express";
import { db, teacherRegistrationsTable, staffRegistrationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "../lib/logger";
import { sendEmail, buildTeacherRegReceivedEmail, buildTeacherRegStatusEmail, buildStaffRegReceivedEmail, buildStaffRegStatusEmail } from "../lib/emailService";

const router: IRouter = Router();

router.post("/register/teacher", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
  const matricule = typeof body.matricule === "string" ? body.matricule.trim() : "";
  const emailUniversitaire = typeof body.emailUniversitaire === "string" ? body.emailUniversitaire.trim().toLowerCase() : "";

  if (!firstName || !lastName || !email.includes("@") || !matricule || !emailUniversitaire.includes("@")) {
    res.status(400).json({ error: "Champs requis manquants ou invalides." });
    return;
  }

  try {
    const [reg] = await db.insert(teacherRegistrationsTable).values({
      id: nanoid(),
      firstName,
      lastName,
      email,
      phone: phone ?? null,
      matricule,
      emailUniversitaire,
      status: "PENDING",
    }).returning();

    const name = `${firstName} ${lastName}`.trim();
    const { subject, html } = buildTeacherRegReceivedEmail({ name, matricule, emailUniversitaire });
    await sendEmail({ to: email, subject, html });

    logger.info({ id: reg.id }, "✅ [REGISTER/TEACHER] Demande enseignant créée");
    res.status(201).json({ id: reg.id, message: "Votre demande d'inscription a été soumise avec succès." });
  } catch (err) {
    logger.error({ err }, "❌ [REGISTER/TEACHER] Erreur");
    res.status(500).json({ error: "Erreur lors de l'enregistrement." });
  }
});

router.post("/register/staff", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
  const matricule = typeof body.matricule === "string" ? body.matricule.trim() : "";
  const emailUniversitaire = typeof body.emailUniversitaire === "string" ? body.emailUniversitaire.trim().toLowerCase() : "";
  const roleStaff = typeof body.roleStaff === "string" ? body.roleStaff.trim() : "";

  if (!firstName || !lastName || !email.includes("@") || !matricule || !emailUniversitaire.includes("@") || !roleStaff) {
    res.status(400).json({ error: "Champs requis manquants ou invalides." });
    return;
  }

  try {
    const [reg] = await db.insert(staffRegistrationsTable).values({
      id: nanoid(),
      firstName,
      lastName,
      email,
      phone: phone ?? null,
      matricule,
      emailUniversitaire,
      roleStaff,
      status: "PENDING",
    }).returning();

    const name = `${firstName} ${lastName}`.trim();
    const { subject, html } = buildStaffRegReceivedEmail({ name, matricule, emailUniversitaire, roleStaff });
    await sendEmail({ to: email, subject, html });

    logger.info({ id: reg.id }, "✅ [REGISTER/STAFF] Demande personnel créée");
    res.status(201).json({ id: reg.id, message: "Votre demande d'inscription a été soumise avec succès." });
  } catch (err) {
    logger.error({ err }, "❌ [REGISTER/STAFF] Erreur");
    res.status(500).json({ error: "Erreur lors de l'enregistrement." });
  }
});

router.get("/register/teachers", async (_req, res): Promise<void> => {
  const regs = await db.select().from(teacherRegistrationsTable).orderBy(desc(teacherRegistrationsTable.createdAt));
  res.json(regs);
});

router.get("/register/staff", async (_req, res): Promise<void> => {
  const regs = await db.select().from(staffRegistrationsTable).orderBy(desc(staffRegistrationsTable.createdAt));
  res.json(regs);
});

router.put("/register/teacher/:id/status", async (req, res): Promise<void> => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;
  const status = body.status as string;
  const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

  if (!["APPROVED", "REJECTED"].includes(status)) {
    res.status(400).json({ error: "Status invalide. Utilisez APPROVED ou REJECTED." });
    return;
  }

  const [reg] = await db
    .update(teacherRegistrationsTable)
    .set({ status: status as "APPROVED" | "REJECTED", notes: notes ?? null })
    .where(eq(teacherRegistrationsTable.id, id))
    .returning();

  if (!reg) {
    res.status(404).json({ error: "Demande non trouvée." });
    return;
  }

  const name = `${reg.firstName} ${reg.lastName}`.trim();
  const { subject, html } = buildTeacherRegStatusEmail({ name, status: status as "APPROVED" | "REJECTED", notes });
  await sendEmail({ to: reg.email, subject, html });

  logger.info({ id, status }, "✅ [REGISTER/TEACHER] Statut mis à jour");
  res.json(reg);
});

router.put("/register/staff/:id/status", async (req, res): Promise<void> => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;
  const status = body.status as string;
  const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

  if (!["APPROVED", "REJECTED"].includes(status)) {
    res.status(400).json({ error: "Status invalide. Utilisez APPROVED ou REJECTED." });
    return;
  }

  const [reg] = await db
    .update(staffRegistrationsTable)
    .set({ status: status as "APPROVED" | "REJECTED", notes: notes ?? null })
    .where(eq(staffRegistrationsTable.id, id))
    .returning();

  if (!reg) {
    res.status(404).json({ error: "Demande non trouvée." });
    return;
  }

  const name = `${reg.firstName} ${reg.lastName}`.trim();
  const { subject, html } = buildStaffRegStatusEmail({ name, status: status as "APPROVED" | "REJECTED", roleStaff: reg.roleStaff, notes });
  await sendEmail({ to: reg.email, subject, html });

  logger.info({ id, status }, "✅ [REGISTER/STAFF] Statut mis à jour");
  res.json(reg);
});

export default router;
