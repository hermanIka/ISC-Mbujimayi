import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, certificatesTable, coursesTable, teachersTable, filieresTable, studentsTable, enrollmentsTable, modulesTable } from "@workspace/db";
import { GetCertificateByIdParams, VerifyCertificateParams } from "@workspace/api-zod";
import { count } from "drizzle-orm";

const router: IRouter = Router();

async function enrichCourse(course: any) {
  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, course.teacherId));
  let filiere = null;
  if (course.filiereId) {
    const [f] = await db.select().from(filieresTable).where(eq(filieresTable.id, course.filiereId));
    if (f) filiere = { ...f, studentCount: 0, courseCount: 0 };
  }
  const [erRow] = await db.select({ count: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, course.id));
  const [modRow] = await db.select({ count: count() }).from(modulesTable).where(eq(modulesTable.courseId, course.id));
  return {
    ...course,
    teacher: teacher ? { ...teacher, courseCount: 0 } : null,
    filiere,
    enrollmentCount: Number(erRow?.count ?? 0),
    moduleCount: Number(modRow?.count ?? 0),
  };
}

router.get("/certificates", async (_req, res): Promise<void> => {
  const certs = await db.select().from(certificatesTable);
  const enriched = await Promise.all(
    certs.map(async (cert) => {
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, cert.courseId));
      return { ...cert, course: course ? await enrichCourse(course) : null };
    }),
  );
  res.json(enriched);
});

router.get("/certificates/verify/:hash", async (req, res): Promise<void> => {
  const params = VerifyCertificateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.hash, params.data.hash));
  if (!cert) {
    res.json({ valid: false, certificate: null, studentName: null, courseName: null });
    return;
  }
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, cert.courseId));
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, cert.studentId));
  const enrichedCourse = course ? await enrichCourse(course) : null;
  res.json({
    valid: true,
    certificate: { ...cert, course: enrichedCourse },
    studentName: student ? `${student.firstName} ${student.lastName}` : null,
    courseName: course?.title ?? null,
  });
});

router.get("/certificates/:id", async (req, res): Promise<void> => {
  const params = GetCertificateByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.id, params.data.id));
  if (!cert) {
    res.status(404).json({ error: "Certificate not found" });
    return;
  }
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, cert.courseId));
  res.json({ ...cert, course: course ? await enrichCourse(course) : null });
});

export default router;
