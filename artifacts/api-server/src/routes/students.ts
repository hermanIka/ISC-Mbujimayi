import { Router, type IRouter } from "express";
import { eq, ilike, or, count, and } from "drizzle-orm";
import { db, studentsTable, filieresTable, enrollmentsTable, paymentsTable, certificatesTable } from "@workspace/db";
import {
  ListStudentsQueryParams,
  CreateStudentBody,
  GetStudentByIdParams,
  UpdateStudentParams,
  UpdateStudentBody,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";

const router: IRouter = Router();

async function studentWithFiliere(student: any) {
  if (!student.filiereId) return { ...student, filiere: null };
  const [filiere] = await db
    .select()
    .from(filieresTable)
    .where(eq(filieresTable.id, student.filiereId));
  if (!filiere) return { ...student, filiere: null };
  const [sr] = await db.select({ count: count() }).from(studentsTable).where(eq(studentsTable.filiereId, filiere.id));
  const [cr] = await db.select({ count: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, filiere.id));
  return {
    ...student,
    filiere: { ...filiere, studentCount: Number(sr?.count ?? 0), courseCount: 0 },
  };
}

router.get("/students", async (req, res): Promise<void> => {
  const params = ListStudentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { page = 1, pageSize = 20, filiereId, search } = params.data;
  const conditions = [
    filiereId ? eq(studentsTable.filiereId, filiereId) : undefined,
    search
      ? or(
          ilike(studentsTable.firstName, `%${search}%`),
          ilike(studentsTable.lastName, `%${search}%`),
          ilike(studentsTable.numEtudiant, `%${search}%`),
        )
      : undefined,
  ].filter((c): c is NonNullable<typeof c> => c != null);
  const students = await db
    .select()
    .from(studentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const total = await db.select({ count: count() }).from(studentsTable);
  const enriched = await Promise.all(students.map(studentWithFiliere));
  res.json({
    students: enriched,
    total: Number(total[0]?.count ?? 0),
    page,
    pageSize,
    totalPages: Math.ceil(Number(total[0]?.count ?? 0) / pageSize),
  });
});

router.post("/students", async (req, res): Promise<void> => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const num = Date.now().toString().slice(-6);
  const { birthDate, ...rest } = parsed.data;
  const [student] = await db
    .insert(studentsTable)
    .values({
      id: nanoid(),
      userId: nanoid(),
      numEtudiant: `ISC${num}`,
      ...rest,
      ...(birthDate ? { birthDate: birthDate instanceof Date ? birthDate.toISOString().split("T")[0] : birthDate } : {}),
    })
    .returning();
  res.status(201).json(await studentWithFiliere(student));
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const params = GetStudentByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, params.data.id));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  const [erRow] = await db.select({ count: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.studentId, student.id));
  const [prRow] = await db.select({ count: count() }).from(paymentsTable).where(eq(paymentsTable.studentId, student.id));
  const [crRow] = await db.select({ count: count() }).from(certificatesTable).where(eq(certificatesTable.studentId, student.id));
  const enriched = await studentWithFiliere(student);
  res.json({
    ...enriched,
    enrollmentCount: Number(erRow?.count ?? 0),
    paymentCount: Number(prRow?.count ?? 0),
    certificateCount: Number(crRow?.count ?? 0),
  });
});

router.put("/students/:id", async (req, res): Promise<void> => {
  const params = UpdateStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [student] = await db
    .update(studentsTable)
    .set(parsed.data)
    .where(eq(studentsTable.id, params.data.id))
    .returning();
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json(await studentWithFiliere(student));
});

export default router;
