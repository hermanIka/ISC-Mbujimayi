import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, teachersTable, coursesTable, filieresTable } from "@workspace/db";
import { requireAcademic } from "../middlewares/auth";
import {
  CreateTeacherBody,
  GetTeacherByIdParams,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";

const router: IRouter = Router();

async function teacherWithCourseCount(teacher: any) {
  const [row] = await db
    .select({ count: count() })
    .from(coursesTable)
    .where(eq(coursesTable.teacherId, teacher.id));
  return { ...teacher, courseCount: Number(row?.count ?? 0) };
}

async function courseWithDetails(course: any) {
  const [teacher] = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.id, course.teacherId));
  let filiere = null;
  if (course.filiereId) {
    const [f] = await db.select().from(filieresTable).where(eq(filieresTable.id, course.filiereId));
    filiere = f ? { ...f, studentCount: 0, courseCount: 0 } : null;
  }
  const [erRow] = await db.select({ count: count() }).from(coursesTable).where(eq(coursesTable.teacherId, course.teacherId));
  return {
    ...course,
    teacher: teacher ? { ...teacher, courseCount: Number(erRow?.count ?? 0) } : null,
    filiere,
    enrollmentCount: 0,
    moduleCount: 0,
  };
}

router.get("/teachers", async (_req, res): Promise<void> => {
  const teachers = await db.select().from(teachersTable);
  const enriched = await Promise.all(teachers.map(teacherWithCourseCount));
  res.json(enriched);
});

router.post("/teachers", requireAcademic, async (req, res): Promise<void> => {
  const parsed = CreateTeacherBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const num = Math.floor(Math.random() * 9000 + 1000);
  const [teacher] = await db
    .insert(teachersTable)
    .values({
      id: nanoid(),
      userId: nanoid(),
      code: `PROF${num}`,
      ...parsed.data,
    })
    .returning();
  res.status(201).json({ ...teacher, courseCount: 0 });
});

router.get("/teachers/:id", async (req, res): Promise<void> => {
  const params = GetTeacherByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [teacher] = await db
    .select()
    .from(teachersTable)
    .where(eq(teachersTable.id, params.data.id));
  if (!teacher) {
    res.status(404).json({ error: "Teacher not found" });
    return;
  }
  const [row] = await db
    .select({ count: count() })
    .from(coursesTable)
    .where(eq(coursesTable.teacherId, teacher.id));
  const courses = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.teacherId, teacher.id));
  const enrichedCourses = await Promise.all(courses.map(courseWithDetails));
  res.json({
    ...teacher,
    courseCount: Number(row?.count ?? 0),
    courses: enrichedCourses,
  });
});

export default router;
