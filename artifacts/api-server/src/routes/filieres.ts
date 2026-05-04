import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, filieresTable, studentsTable, coursesTable } from "@workspace/db";
import { requireAdmin, requireAcademic } from "../middlewares/auth";
import {
  CreateFiliereBody,
  GetFiliereByIdParams,
  UpdateFiliereParams,
  UpdateFiliereBody,
  DeleteFiliereParams,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";

const router: IRouter = Router();

async function filieresWithCounts() {
  const filieres = await db.select().from(filieresTable);
  const result = await Promise.all(
    filieres.map(async (f) => {
      const [studentRow] = await db
        .select({ count: count() })
        .from(studentsTable)
        .where(eq(studentsTable.filiereId, f.id));
      const [courseRow] = await db
        .select({ count: count() })
        .from(coursesTable)
        .where(eq(coursesTable.filiereId, f.id));
      return {
        ...f,
        studentCount: Number(studentRow?.count ?? 0),
        courseCount: Number(courseRow?.count ?? 0),
      };
    }),
  );
  return result;
}

router.get("/filieres", async (_req, res): Promise<void> => {
  const filieres = await filieresWithCounts();
  res.json(filieres);
});

router.post("/filieres", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateFiliereBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [filiere] = await db
    .insert(filieresTable)
    .values({ id: nanoid(), ...parsed.data })
    .returning();
  res.status(201).json({ ...filiere, studentCount: 0, courseCount: 0 });
});

router.get("/filieres/:id", async (req, res): Promise<void> => {
  const params = GetFiliereByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [filiere] = await db
    .select()
    .from(filieresTable)
    .where(eq(filieresTable.id, params.data.id));
  if (!filiere) {
    res.status(404).json({ error: "Filiere not found" });
    return;
  }
  const [studentRow] = await db
    .select({ count: count() })
    .from(studentsTable)
    .where(eq(studentsTable.filiereId, filiere.id));
  const [courseRow] = await db
    .select({ count: count() })
    .from(coursesTable)
    .where(eq(coursesTable.filiereId, filiere.id));
  res.json({
    ...filiere,
    studentCount: Number(studentRow?.count ?? 0),
    courseCount: Number(courseRow?.count ?? 0),
  });
});

router.put("/filieres/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateFiliereParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateFiliereBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [filiere] = await db
    .update(filieresTable)
    .set(parsed.data)
    .where(eq(filieresTable.id, params.data.id))
    .returning();
  if (!filiere) {
    res.status(404).json({ error: "Filiere not found" });
    return;
  }
  res.json({ ...filiere, studentCount: 0, courseCount: 0 });
});

router.delete("/filieres/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteFiliereParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(filieresTable).where(eq(filieresTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
