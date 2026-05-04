import { Router, type IRouter } from "express";
import { eq, count, and } from "drizzle-orm";
import { db, inscriptionsTable, studentsTable, filieresTable, usersTable, inscriptionStatusEnum, type Student, type Inscription } from "@workspace/db";
import {
  ListInscriptionsQueryParams,
  CreateInscriptionBody,
  GetInscriptionByIdParams,
  UpdateInscriptionStatusParams,
  UpdateInscriptionStatusBody,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";
import { requireAuth, requireAcademic, getCallerDbUser } from "../middlewares/auth";
import { sendEmail, buildInscriptionStatusEmail } from "../lib/emailService";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function enrichStudent(student: Student | null) {
  if (!student) return null;
  let filiere = null;
  if (student.filiereId) {
    const [f] = await db.select().from(filieresTable).where(eq(filieresTable.id, student.filiereId));
    filiere = f ? { ...f, studentCount: 0, courseCount: 0 } : null;
  }
  return { ...student, filiere };
}

async function enrichInscription(ins: Inscription) {
  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, ins.studentId));
  return { ...ins, student: await enrichStudent(student), documents: ins.documents ?? [] };
}

async function sendInscriptionStatusEmail(
  ins: Inscription,
  status: "APPROVED" | "REJECTED",
  notes?: string | null,
): Promise<void> {
  try {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, ins.studentId));
    if (!student) return;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, student.userId));
    const email = user?.email;
    if (!email) {
      logger.warn({ studentId: ins.studentId }, "📧 [EMAIL] No email for student — skipping inscription status email");
      return;
    }

    const studentName = `${student.firstName} ${student.lastName}`.trim();
    let filiereName: string | null = null;
    if (student.filiereId) {
      const [filiere] = await db.select().from(filieresTable).where(eq(filieresTable.id, student.filiereId));
      filiereName = filiere?.name ?? null;
    }

    const { subject, html } = buildInscriptionStatusEmail({
      studentName,
      status,
      notes,
      filiereName,
    });

    await sendEmail({ to: email, subject, html });
  } catch (err) {
    logger.error({ err, inscriptionId: ins.id }, "📧 [EMAIL] Failed to send inscription status email");
  }
}

router.get("/inscriptions", requireAuth, async (req, res): Promise<void> => {
  const params = ListInscriptionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { page = 1, pageSize = 20, status } = params.data;

  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const isStaff = ["ADMIN", "DIRECTOR", "ACADEMIC_SERVICE"].includes(callerUser.role);

  let whereClause;
  if (isStaff) {
    whereClause = status
      ? eq(inscriptionsTable.status, status as typeof inscriptionStatusEnum.enumValues[number])
      : undefined;
  } else {
    const [callerStudent] = await db.select().from(studentsTable).where(eq(studentsTable.userId, callerUser.id));
    if (!callerStudent) {
      res.json({ inscriptions: [], total: 0, page, pageSize, totalPages: 0 });
      return;
    }
    whereClause = status
      ? and(eq(inscriptionsTable.studentId, callerStudent.id), eq(inscriptionsTable.status, status as typeof inscriptionStatusEnum.enumValues[number]))
      : eq(inscriptionsTable.studentId, callerStudent.id);
  }

  const inscriptions = await db
    .select()
    .from(inscriptionsTable)
    .where(whereClause)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [totalRow] = await db.select({ count: count() }).from(inscriptionsTable).where(whereClause);
  const total = Number(totalRow?.count ?? 0);
  const enriched = await Promise.all(inscriptions.map(enrichInscription));
  res.json({ inscriptions: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

router.post("/inscriptions", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateInscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const isStaff = ["ADMIN", "DIRECTOR", "ACADEMIC_SERVICE"].includes(callerUser.role);
  let resolvedStudentId: string;
  if (isStaff) {
    resolvedStudentId = parsed.data.studentId;
  } else {
    const [callerStudent] = await db.select().from(studentsTable).where(eq(studentsTable.userId, callerUser.id));
    if (!callerStudent) {
      res.status(403).json({ error: "No student profile found for this account" });
      return;
    }
    resolvedStudentId = callerStudent.id;
  }
  const { documents, ...rest } = parsed.data;
  const serializedDocs = (documents ?? []).map((d) => ({
    ...d,
    uploadedAt: d.uploadedAt instanceof Date ? d.uploadedAt.toISOString() : String(d.uploadedAt),
  }));
  const [ins] = await db
    .insert(inscriptionsTable)
    .values({ id: nanoid(), ...rest, studentId: resolvedStudentId, documents: serializedDocs })
    .returning();
  res.status(201).json(await enrichInscription(ins));
});

router.get("/inscriptions/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetInscriptionByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [ins] = await db
    .select()
    .from(inscriptionsTable)
    .where(eq(inscriptionsTable.id, params.data.id));
  if (!ins) {
    res.status(404).json({ error: "Inscription not found" });
    return;
  }
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const isStaff = ["ADMIN", "DIRECTOR", "ACADEMIC_SERVICE"].includes(callerUser.role);
  if (!isStaff) {
    const [callerStudent] = await db.select().from(studentsTable).where(eq(studentsTable.userId, callerUser.id));
    if (!callerStudent || ins.studentId !== callerStudent.id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
  }
  res.json(await enrichInscription(ins));
});

router.put("/inscriptions/:id/status", requireAcademic, async (req, res): Promise<void> => {
  const params = UpdateInscriptionStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateInscriptionStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [ins] = await db
    .update(inscriptionsTable)
    .set({ status: parsed.data.status as typeof inscriptionStatusEnum.enumValues[number], notes: parsed.data.notes, reviewedAt: new Date() })
    .where(eq(inscriptionsTable.id, params.data.id))
    .returning();
  if (!ins) {
    res.status(404).json({ error: "Inscription not found" });
    return;
  }

  const newStatus = parsed.data.status;
  if (newStatus === "APPROVED" || newStatus === "REJECTED") {
    void sendInscriptionStatusEmail(ins, newStatus, parsed.data.notes);
  }

  res.json(await enrichInscription(ins));
});

export default router;
