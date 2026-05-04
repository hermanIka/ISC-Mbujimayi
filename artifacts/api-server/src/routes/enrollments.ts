import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import {
  db,
  enrollmentsTable,
  chapterProgressTable,
  coursesTable,
  modulesTable,
  chaptersTable,
  teachersTable,
  filieresTable,
  certificatesTable,
} from "@workspace/db";
import {
  ListEnrollmentsQueryParams,
  CreateEnrollmentBody,
  GetEnrollmentByIdParams,
  MarkChapterProgressBody,
  MarkChapterProgressParams,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";
import crypto from "crypto";

const router: IRouter = Router();

async function enrichCourseForEnrollment(course: any) {
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

async function calculateProgress(enrollmentId: string) {
  const enrollment = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.id, enrollmentId)).then(r => r[0]);
  if (!enrollment) return 0;
  const modules = await db.select().from(modulesTable).where(eq(modulesTable.courseId, enrollment.courseId));
  let totalChapters = 0;
  for (const mod of modules) {
    const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.moduleId, mod.id));
    totalChapters += chapters.length;
  }
  if (totalChapters === 0) return 0;
  const completed = await db
    .select()
    .from(chapterProgressTable)
    .where(eq(chapterProgressTable.enrollmentId, enrollmentId));
  const completedCount = completed.filter(c => c.completedAt !== null).length;
  return Math.round((completedCount / totalChapters) * 100);
}

router.get("/enrollments", async (req, res): Promise<void> => {
  const params = ListEnrollmentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { page = 1, pageSize = 20 } = params.data;
  const enrollments = await db.select().from(enrollmentsTable).limit(pageSize).offset((page - 1) * pageSize);
  const [totalRow] = await db.select({ count: count() }).from(enrollmentsTable);
  const total = Number(totalRow?.count ?? 0);
  const enriched = await Promise.all(
    enrollments.map(async (e) => {
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, e.courseId));
      const progressPercent = await calculateProgress(e.id);
      return { ...e, course: course ? await enrichCourseForEnrollment(course) : null, progressPercent };
    }),
  );
  res.json({ enrollments: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

router.post("/enrollments", async (req, res): Promise<void> => {
  const parsed = CreateEnrollmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const students = await db.select().from(enrollmentsTable).limit(1);
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, parsed.data.courseId));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  const [enrollment] = await db
    .insert(enrollmentsTable)
    .values({ id: nanoid(), studentId: nanoid(), courseId: parsed.data.courseId })
    .returning();
  res.status(201).json({
    ...enrollment,
    course: await enrichCourseForEnrollment(course),
    progressPercent: 0,
  });
});

router.get("/enrollments/:id", async (req, res): Promise<void> => {
  const params = GetEnrollmentByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [enrollment] = await db
    .select()
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.id, params.data.id));
  if (!enrollment) {
    res.status(404).json({ error: "Enrollment not found" });
    return;
  }
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, enrollment.courseId));
  const progressPercent = await calculateProgress(enrollment.id);
  const chapterProgress = await db
    .select()
    .from(chapterProgressTable)
    .where(eq(chapterProgressTable.enrollmentId, enrollment.id));
  res.json({
    ...enrollment,
    course: course ? await enrichCourseForEnrollment(course) : null,
    progressPercent,
    chapterProgress,
  });
});

router.post("/chapters/:chapterId/progress", async (req, res): Promise<void> => {
  const params = MarkChapterProgressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = MarkChapterProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { enrollmentId, completed, watchedSeconds } = parsed.data;
  const existing = await db
    .select()
    .from(chapterProgressTable)
    .where(eq(chapterProgressTable.enrollmentId, enrollmentId));
  const existingForChapter = existing.find(p => p.chapterId === params.data.chapterId);

  let chapterProgress: any;
  if (existingForChapter) {
    const [updated] = await db
      .update(chapterProgressTable)
      .set({
        completedAt: completed ? new Date() : existingForChapter.completedAt,
        watchedSeconds: watchedSeconds ?? existingForChapter.watchedSeconds,
      })
      .where(eq(chapterProgressTable.id, existingForChapter.id))
      .returning();
    chapterProgress = updated;
  } else {
    const [created] = await db
      .insert(chapterProgressTable)
      .values({
        id: nanoid(),
        enrollmentId,
        chapterId: params.data.chapterId,
        completedAt: completed ? new Date() : null,
        watchedSeconds: watchedSeconds ?? null,
      })
      .returning();
    chapterProgress = created;
  }

  const progressPercent = await calculateProgress(enrollmentId);

  let certificateGenerated = false;
  let certificate = null;
  if (progressPercent >= 100) {
    const [enrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.id, enrollmentId));
    if (enrollment) {
      const existing = await db
        .select()
        .from(certificatesTable)
        .where(eq(certificatesTable.courseId, enrollment.courseId));
      if (!existing[0]) {
        const hash = crypto
          .createHash("sha256")
          .update(`${enrollmentId}-${enrollment.courseId}-${Date.now()}`)
          .digest("hex")
          .slice(0, 32);
        const [cert] = await db
          .insert(certificatesTable)
          .values({
            id: nanoid(),
            studentId: enrollment.studentId,
            courseId: enrollment.courseId,
            hash,
          })
          .returning();
        certificateGenerated = true;
        certificate = cert;
      }
    }
  }

  res.json({ chapterProgress, courseProgressPercent: progressPercent, certificateGenerated, certificate });
});

export default router;
