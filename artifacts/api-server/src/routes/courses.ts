import { Router, type IRouter } from "express";
import { eq, count, and, isNotNull, inArray } from "drizzle-orm";
import { db, coursesTable, teachersTable, filieresTable, modulesTable, chaptersTable, enrollmentsTable, chapterProgressTable, studentsTable, usersTable, evaluationResultsTable, evaluationsTable, courseStatusEnum, type Course } from "@workspace/db";
import { requireAuth, requireTeacher, requireAdmin, getCallerDbUser } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { sendEmail, buildCourseApprovedEmail, buildCourseRejectedEmail } from "../lib/emailService";
import {
  ListCoursesQueryParams,
  CreateCourseBody,
  GetCourseByIdParams,
  UpdateCourseParams,
  UpdateCourseBody,
  DeleteCourseParams,
  ListModulesParams,
  CreateModuleParams,
  CreateModuleBody,
  UpdateModuleParams,
  UpdateModuleBody,
  DeleteModuleParams,
  ListChaptersParams,
  CreateChapterParams,
  CreateChapterBody,
  UpdateChapterParams,
  UpdateChapterBody,
  DeleteChapterParams,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";

const router: IRouter = Router();

async function getCallerTeacherId(req: import("express").Request): Promise<string | null> {
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) return null;
  if (["ADMIN", "DIRECTOR"].includes(callerUser.role)) return "BYPASS";
  const [t] = await db.select().from(teachersTable).where(eq(teachersTable.userId, callerUser.id));
  return t?.id ?? null;
}

async function assertCourseOwner(req: import("express").Request, courseId: string, res: import("express").Response): Promise<boolean> {
  const tid = await getCallerTeacherId(req);
  if (!tid) { res.status(401).json({ error: "User not found" }); return false; }
  if (tid === "BYPASS") return true;
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) { res.status(404).json({ error: "Course not found" }); return false; }
  if (course.teacherId !== tid) { res.status(403).json({ error: "Access denied: you do not own this course" }); return false; }
  return true;
}

async function assertModuleOwner(req: import("express").Request, moduleId: string, res: import("express").Response): Promise<boolean> {
  const [mod] = await db.select().from(modulesTable).where(eq(modulesTable.id, moduleId));
  if (!mod) { res.status(404).json({ error: "Module not found" }); return false; }
  return assertCourseOwner(req, mod.courseId, res);
}

async function assertChapterOwner(req: import("express").Request, chapterId: string, res: import("express").Response): Promise<boolean> {
  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, chapterId));
  if (!chapter) { res.status(404).json({ error: "Chapter not found" }); return false; }
  return assertModuleOwner(req, chapter.moduleId, res);
}

async function enrichTeacher(teacherId: string) {
  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, teacherId));
  if (!teacher) return null;
  const [row] = await db.select({ count: count() }).from(coursesTable).where(eq(coursesTable.teacherId, teacherId));
  return { ...teacher, courseCount: Number(row?.count ?? 0) };
}

async function enrichCourse(course: Course) {
  const teacher = await enrichTeacher(course.teacherId);
  let filiere = null;
  if (course.filiereId) {
    const [f] = await db.select().from(filieresTable).where(eq(filieresTable.id, course.filiereId));
    if (f) filiere = { ...f, studentCount: 0, courseCount: 0 };
  }
  const [erRow] = await db.select({ count: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, course.id));
  const [modRow] = await db.select({ count: count() }).from(modulesTable).where(eq(modulesTable.courseId, course.id));
  return {
    ...course,
    teacher,
    filiere,
    enrollmentCount: Number(erRow?.count ?? 0),
    moduleCount: Number(modRow?.count ?? 0),
  };
}

router.get("/courses", async (req, res): Promise<void> => {
  const params = ListCoursesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { page = 1, pageSize = 20, filiereId, teacherId, status } = params.data;
  const conditions = [
    status ? eq(coursesTable.status, status as typeof courseStatusEnum.enumValues[number]) : undefined,
    filiereId ? eq(coursesTable.filiereId, filiereId) : undefined,
    teacherId ? eq(coursesTable.teacherId, teacherId) : undefined,
  ].filter((c): c is NonNullable<typeof c> => c != null);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const courses = await db
    .select()
    .from(coursesTable)
    .where(whereClause)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [totalRow] = await db.select({ count: count() }).from(coursesTable).where(whereClause);
  const total = Number(totalRow?.count ?? 0);
  const enriched = await Promise.all(courses.map(enrichCourse));
  res.json({ courses: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

router.post("/courses", requireTeacher, async (req, res): Promise<void> => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const [callerTeacher] = await db.select().from(teachersTable).where(eq(teachersTable.userId, callerUser.id));
  if (!callerTeacher) {
    res.status(403).json({ error: "No teacher profile found for this user" });
    return;
  }
  const [course] = await db
    .insert(coursesTable)
    .values({ id: nanoid(), teacherId: callerTeacher.id, ...parsed.data })
    .returning();
  res.status(201).json(await enrichCourse(course));
});

router.get("/courses/:id", async (req, res): Promise<void> => {
  const params = GetCourseByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, params.data.id));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  const enriched = await enrichCourse(course);
  const modules = await db.select().from(modulesTable).where(eq(modulesTable.courseId, course.id));
  const modulesWithChapters = await Promise.all(
    modules.map(async (mod) => {
      const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.moduleId, mod.id));
      return { ...mod, chapterCount: chapters.length, chapters };
    }),
  );
  res.json({ ...enriched, modules: modulesWithChapters });
});

router.put("/courses/:id", requireTeacher, async (req, res): Promise<void> => {
  const params = UpdateCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db.select().from(coursesTable).where(eq(coursesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const isAdmin = ["ADMIN", "DIRECTOR"].includes(callerUser.role);
  if (!isAdmin) {
    const [callerTeacher] = await db.select().from(teachersTable).where(eq(teachersTable.userId, callerUser.id));
    if (!callerTeacher || existing.teacherId !== callerTeacher.id) {
      res.status(403).json({ error: "Access denied: you do not own this course" });
      return;
    }
  }
  const [course] = await db
    .update(coursesTable)
    .set(parsed.data)
    .where(eq(coursesTable.id, params.data.id))
    .returning();
  res.json(await enrichCourse(course));
});

router.delete("/courses/:id", requireTeacher, async (req, res): Promise<void> => {
  const params = DeleteCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db.select().from(coursesTable).where(eq(coursesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const isAdmin = ["ADMIN", "DIRECTOR"].includes(callerUser.role);
  if (!isAdmin) {
    const [callerTeacher] = await db.select().from(teachersTable).where(eq(teachersTable.userId, callerUser.id));
    if (!callerTeacher || existing.teacherId !== callerTeacher.id) {
      res.status(403).json({ error: "Access denied: you do not own this course" });
      return;
    }
  }
  await db.delete(coursesTable).where(eq(coursesTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/courses/:courseId/modules", async (req, res): Promise<void> => {
  const params = ListModulesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const modules = await db
    .select()
    .from(modulesTable)
    .where(eq(modulesTable.courseId, params.data.courseId));
  const withCounts = await Promise.all(
    modules.map(async (m) => {
      const [row] = await db.select({ count: count() }).from(chaptersTable).where(eq(chaptersTable.moduleId, m.id));
      return { ...m, chapterCount: Number(row?.count ?? 0) };
    }),
  );
  res.json(withCounts);
});

router.post("/courses/:courseId/modules", requireTeacher, async (req, res): Promise<void> => {
  const params = CreateModuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!await assertCourseOwner(req, params.data.courseId, res)) return;
  const parsed = CreateModuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [mod] = await db
    .insert(modulesTable)
    .values({ id: nanoid(), courseId: params.data.courseId, ...parsed.data })
    .returning();
  res.status(201).json({ ...mod, chapterCount: 0 });
});

router.put("/modules/:id", requireTeacher, async (req, res): Promise<void> => {
  const params = UpdateModuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!await assertModuleOwner(req, params.data.id, res)) return;
  const parsed = UpdateModuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [mod] = await db
    .update(modulesTable)
    .set(parsed.data)
    .where(eq(modulesTable.id, params.data.id))
    .returning();
  if (!mod) {
    res.status(404).json({ error: "Module not found" });
    return;
  }
  const [row] = await db.select({ count: count() }).from(chaptersTable).where(eq(chaptersTable.moduleId, mod.id));
  res.json({ ...mod, chapterCount: Number(row?.count ?? 0) });
});

router.delete("/modules/:id", requireTeacher, async (req, res): Promise<void> => {
  const params = DeleteModuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!await assertModuleOwner(req, params.data.id, res)) return;
  await db.delete(modulesTable).where(eq(modulesTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/modules/:moduleId/chapters", async (req, res): Promise<void> => {
  const params = ListChaptersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const chapters = await db
    .select()
    .from(chaptersTable)
    .where(eq(chaptersTable.moduleId, params.data.moduleId));
  res.json(chapters);
});

router.post("/modules/:moduleId/chapters", requireTeacher, async (req, res): Promise<void> => {
  const params = CreateChapterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!await assertModuleOwner(req, params.data.moduleId, res)) return;
  const parsed = CreateChapterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [chapter] = await db
    .insert(chaptersTable)
    .values({ id: nanoid(), moduleId: params.data.moduleId, ...parsed.data })
    .returning();
  res.status(201).json(chapter);
});

router.put("/chapters/:id", requireTeacher, async (req, res): Promise<void> => {
  const params = UpdateChapterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!await assertChapterOwner(req, params.data.id, res)) return;
  const parsed = UpdateChapterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [chapter] = await db
    .update(chaptersTable)
    .set(parsed.data)
    .where(eq(chaptersTable.id, params.data.id))
    .returning();
  if (!chapter) {
    res.status(404).json({ error: "Chapter not found" });
    return;
  }
  res.json(chapter);
});

router.delete("/chapters/:id", requireTeacher, async (req, res): Promise<void> => {
  const params = DeleteChapterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!await assertChapterOwner(req, params.data.id, res)) return;
  await db.delete(chaptersTable).where(eq(chaptersTable.id, params.data.id));
  res.sendStatus(204);
});

router.put("/courses/:id/submit", requireTeacher, async (req, res): Promise<void> => {
  const { id } = req.params;
  if (!await assertCourseOwner(req, id, res)) return;
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!course) { res.status(404).json({ error: "Cours introuvable" }); return; }
  if (course.status !== "DRAFT" && course.status !== "REJECTED") {
    res.status(400).json({ error: "Seuls les cours en brouillon ou rejetés peuvent être soumis" });
    return;
  }
  const [updated] = await db
    .update(coursesTable)
    .set({ status: "PENDING_REVIEW", rejectionNotes: null })
    .where(eq(coursesTable.id, id))
    .returning();
  logger.info({ id }, "📤 [COURSES] Soumis pour validation");
  res.json(await enrichCourse(updated));
});

router.put("/courses/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!course) { res.status(404).json({ error: "Cours introuvable" }); return; }
  if (course.status !== "PENDING_REVIEW") {
    res.status(400).json({ error: "Seuls les cours en attente peuvent être approuvés" }); return;
  }
  const [updated] = await db
    .update(coursesTable)
    .set({ status: "PUBLISHED", rejectionNotes: null })
    .where(eq(coursesTable.id, id))
    .returning();
  try {
    const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, course.teacherId));
    if (teacher?.userId) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, teacher.userId));
      if (user?.email) {
        const emailData = buildCourseApprovedEmail(`${teacher.firstName} ${teacher.lastName}`, course.title);
        await sendEmail({ to: user.email, ...emailData });
      }
    }
  } catch { logger.warn("Failed to send course approved email"); }
  logger.info({ id }, "✅ [COURSES] Cours approuvé");
  res.json(await enrichCourse(updated));
});

router.put("/courses/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const { id } = req.params;
  const body = req.body as { notes?: string };
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!course) { res.status(404).json({ error: "Cours introuvable" }); return; }
  if (course.status !== "PENDING_REVIEW") {
    res.status(400).json({ error: "Seuls les cours en attente peuvent être rejetés" }); return;
  }
  const [updated] = await db
    .update(coursesTable)
    .set({ status: "REJECTED", rejectionNotes: body.notes ?? null })
    .where(eq(coursesTable.id, id))
    .returning();
  try {
    const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.id, course.teacherId));
    if (teacher?.userId) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, teacher.userId));
      if (user?.email) {
        const emailData = buildCourseRejectedEmail(`${teacher.firstName} ${teacher.lastName}`, course.title, body.notes);
        await sendEmail({ to: user.email, ...emailData });
      }
    }
  } catch { logger.warn("Failed to send course rejected email"); }
  logger.info({ id, notes: body.notes }, "❌ [COURSES] Cours rejeté");
  res.json(await enrichCourse(updated));
});

router.get("/courses/:id/students-progress", requireTeacher, async (req, res): Promise<void> => {
  const { id } = req.params;
  if (!await assertCourseOwner(req, id, res)) return;

  const modules = await db.select().from(modulesTable).where(eq(modulesTable.courseId, id));
  const allChaptersArrays = await Promise.all(
    modules.map((m) => db.select().from(chaptersTable).where(eq(chaptersTable.moduleId, m.id)))
  );
  const totalChapters = allChaptersArrays.flat().length;

  const courseEvaluations = await db
    .select({ id: evaluationsTable.id })
    .from(evaluationsTable)
    .where(eq(evaluationsTable.courseId, id));
  const courseEvalIds = courseEvaluations.map((e) => e.id);

  const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.courseId, id));

  const progress = await Promise.all(enrollments.map(async (enrollment) => {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, enrollment.studentId));
    const user = student?.userId
      ? (await db.select().from(usersTable).where(eq(usersTable.id, student.userId)))[0]
      : null;
    const completedChaps = await db
      .select()
      .from(chapterProgressTable)
      .where(and(eq(chapterProgressTable.enrollmentId, enrollment.id), isNotNull(chapterProgressTable.completedAt)));

    const evalResults = courseEvalIds.length > 0
      ? await db
          .select()
          .from(evaluationResultsTable)
          .where(and(
            eq(evaluationResultsTable.studentId, enrollment.studentId),
            inArray(evaluationResultsTable.evaluationId, courseEvalIds)
          ))
      : [];

    return {
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      studentName: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : enrollment.studentId,
      studentEmail: user?.email ?? null,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      completedChapters: completedChaps.length,
      totalChapters,
      progressPercent: totalChapters > 0 ? Math.round((completedChaps.length / totalChapters) * 100) : 0,
      evaluationResults: evalResults.map((r) => ({
        evaluationId: r.evaluationId,
        score: r.score,
        maxScore: r.maxScore,
        percent: r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0,
        passed: r.maxScore > 0 ? (r.score / r.maxScore) * 100 >= 50 : false,
      })),
    };
  }));

  res.json(progress);
});

export default router;
