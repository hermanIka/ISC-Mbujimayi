import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, inscriptionsTable, studentsTable, filieresTable, inscriptionStatusEnum } from "@workspace/db";
import {
  ListInscriptionsQueryParams,
  CreateInscriptionBody,
  GetInscriptionByIdParams,
  UpdateInscriptionStatusParams,
  UpdateInscriptionStatusBody,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";
import { requireAuth, requireAcademic } from "../middlewares/auth";

const router: IRouter = Router();

async function enrichStudent(student: any) {
  if (!student) return null;
  let filiere = null;
  if (student.filiereId) {
    const [f] = await db.select().from(filieresTable).where(eq(filieresTable.id, student.filiereId));
    filiere = f ? { ...f, studentCount: 0, courseCount: 0 } : null;
  }
  return { ...student, filiere };
}

async function enrichInscription(ins: any) {
  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, ins.studentId));
  return { ...ins, student: await enrichStudent(student), documents: ins.documents ?? [] };
}

router.get("/inscriptions", requireAuth, async (req, res): Promise<void> => {
  const params = ListInscriptionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { page = 1, pageSize = 20, status } = params.data;
  const whereClause = status
    ? eq(inscriptionsTable.status, status as typeof inscriptionStatusEnum.enumValues[number])
    : undefined;
  const inscriptions = await db
    .select()
    .from(inscriptionsTable)
    .where(whereClause)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [totalRow] = await db.select({ count: count() }).from(inscriptionsTable);
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
  const { documents, ...rest } = parsed.data;
  const serializedDocs = (documents ?? []).map((d) => ({
    ...d,
    uploadedAt: d.uploadedAt instanceof Date ? d.uploadedAt.toISOString() : String(d.uploadedAt),
  }));
  const [ins] = await db
    .insert(inscriptionsTable)
    .values({ id: nanoid(), ...rest, documents: serializedDocs })
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
  res.json(await enrichInscription(ins));
});

export default router;
