import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, evaluationsTable, questionsTable, evaluationResultsTable } from "@workspace/db";
import {
  ListEvaluationsParams,
  CreateEvaluationParams,
  CreateEvaluationBody,
  GetEvaluationByIdParams,
  UpdateEvaluationParams,
  UpdateEvaluationBody,
  DeleteEvaluationParams,
  SubmitEvaluationParams,
  SubmitEvaluationBody,
  ListEvaluationResultsParams,
  GradeResultParams,
  GradeResultBody,
  ListQuestionsParams,
  CreateQuestionParams,
  CreateQuestionBody,
  UpdateQuestionParams,
  DeleteQuestionParams,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";

const router: IRouter = Router();

router.get("/courses/:courseId/evaluations", async (req, res): Promise<void> => {
  const params = ListEvaluationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const evals = await db
    .select()
    .from(evaluationsTable)
    .where(eq(evaluationsTable.courseId, params.data.courseId));
  const enriched = await Promise.all(
    evals.map(async (e) => {
      const [qRow] = await db.select({ count: count() }).from(questionsTable).where(eq(questionsTable.evaluationId, e.id));
      return { ...e, questionCount: Number(qRow?.count ?? 0) };
    }),
  );
  res.json(enriched);
});

router.post("/courses/:courseId/evaluations", async (req, res): Promise<void> => {
  const params = CreateEvaluationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateEvaluationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [ev] = await db
    .insert(evaluationsTable)
    .values({ id: nanoid(), courseId: params.data.courseId, passMark: 50, ...parsed.data })
    .returning();
  res.status(201).json({ ...ev, questionCount: 0 });
});

router.get("/evaluations/:id", async (req, res): Promise<void> => {
  const params = GetEvaluationByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [ev] = await db
    .select()
    .from(evaluationsTable)
    .where(eq(evaluationsTable.id, params.data.id));
  if (!ev) {
    res.status(404).json({ error: "Evaluation not found" });
    return;
  }
  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.evaluationId, ev.id));
  res.json({ ...ev, questionCount: questions.length, questions });
});

router.put("/evaluations/:id", async (req, res): Promise<void> => {
  const params = UpdateEvaluationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEvaluationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [ev] = await db
    .update(evaluationsTable)
    .set(parsed.data)
    .where(eq(evaluationsTable.id, params.data.id))
    .returning();
  if (!ev) {
    res.status(404).json({ error: "Evaluation not found" });
    return;
  }
  const [qRow] = await db.select({ count: count() }).from(questionsTable).where(eq(questionsTable.evaluationId, ev.id));
  res.json({ ...ev, questionCount: Number(qRow?.count ?? 0) });
});

router.delete("/evaluations/:id", async (req, res): Promise<void> => {
  const params = DeleteEvaluationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(evaluationsTable).where(eq(evaluationsTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/evaluations/:id/submit", async (req, res): Promise<void> => {
  const params = SubmitEvaluationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SubmitEvaluationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [ev] = await db
    .select()
    .from(evaluationsTable)
    .where(eq(evaluationsTable.id, params.data.id));
  if (!ev) {
    res.status(404).json({ error: "Evaluation not found" });
    return;
  }
  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.evaluationId, ev.id));
  let score = 0;
  const maxScore = questions.reduce((acc, q) => acc + q.points, 0);
  for (const answer of parsed.data.answers) {
    const q = questions.find((q) => q.id === answer.questionId);
    if (!q || !q.options) continue;
    const correct = q.options.find((o) => o.isCorrect);
    if (correct && correct.text === answer.answer) score += q.points;
  }
  const passed = maxScore > 0 ? (score / maxScore) * 100 >= ev.passMark : false;
  const [result] = await db
    .insert(evaluationResultsTable)
    .values({
      id: nanoid(),
      studentId: nanoid(),
      evaluationId: ev.id,
      score,
      maxScore,
      answers: parsed.data.answers as any,
    })
    .returning();
  res.status(201).json({ ...result, passed });
});

router.get("/evaluations/:id/results", async (req, res): Promise<void> => {
  const params = ListEvaluationResultsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const results = await db
    .select()
    .from(evaluationResultsTable)
    .where(eq(evaluationResultsTable.evaluationId, params.data.id));
  const formatted = results.map(r => {
    const ev = evaluationsTable;
    return { ...r, passed: r.maxScore > 0 ? (r.score / r.maxScore) * 100 >= 50 : false };
  });
  res.json(formatted);
});

router.put("/results/:id/grade", async (req, res): Promise<void> => {
  const params = GradeResultParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = GradeResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [result] = await db
    .update(evaluationResultsTable)
    .set({ score: parsed.data.score, feedback: parsed.data.feedback, gradedAt: new Date() })
    .where(eq(evaluationResultsTable.id, params.data.id))
    .returning();
  if (!result) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  res.json({ ...result, passed: result.maxScore > 0 ? (result.score / result.maxScore) * 100 >= 50 : false });
});

router.get("/evaluations/:evaluationId/questions", async (req, res): Promise<void> => {
  const params = ListQuestionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.evaluationId, params.data.evaluationId));
  res.json(questions);
});

router.post("/evaluations/:evaluationId/questions", async (req, res): Promise<void> => {
  const params = CreateQuestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [question] = await db
    .insert(questionsTable)
    .values({
      id: nanoid(),
      evaluationId: params.data.evaluationId,
      ...parsed.data,
      options: parsed.data.options as any,
    })
    .returning();
  res.status(201).json(question);
});

router.put("/questions/:id", async (req, res): Promise<void> => {
  const params = UpdateQuestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [question] = await db
    .update(questionsTable)
    .set({ ...parsed.data, options: parsed.data.options as any })
    .where(eq(questionsTable.id, params.data.id))
    .returning();
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  res.json(question);
});

router.delete("/questions/:id", async (req, res): Promise<void> => {
  const params = DeleteQuestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(questionsTable).where(eq(questionsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
