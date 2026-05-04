import { pgTable, text, integer, json, timestamp, pgEnum, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";
import { studentsTable } from "./students";

export const evaluationTypeEnum = pgEnum("evaluation_type", [
  "QUIZ",
  "ASSIGNMENT",
  "EXAM",
]);

export const evaluationsTable = pgTable(
  "evaluations",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: evaluationTypeEnum("type").notNull(),
    duration: integer("duration").notNull(),
    passMark: integer("pass_mark").notNull().default(50),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("evaluations_course_id_idx").on(t.courseId)]
);

export const questionsTable = pgTable(
  "questions",
  {
    id: text("id").primaryKey(),
    evaluationId: text("evaluation_id")
      .notNull()
      .references(() => evaluationsTable.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    options: json("options").$type<Array<{ text: string; isCorrect: boolean }>>(),
    correctAnswer: text("correct_answer"),
    points: integer("points").notNull().default(1),
    order: integer("order").notNull(),
  },
  (t) => [index("questions_evaluation_id_idx").on(t.evaluationId)]
);

export const evaluationResultsTable = pgTable(
  "evaluation_results",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id),
    evaluationId: text("evaluation_id")
      .notNull()
      .references(() => evaluationsTable.id),
    score: integer("score").notNull(),
    maxScore: integer("max_score").notNull(),
    answers: json("answers").notNull().$type<Array<{ questionId: string; answer: string }>>(),
    feedback: text("feedback"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    gradedAt: timestamp("graded_at", { withTimezone: true }),
  },
  (t) => [
    unique("results_student_evaluation_unique").on(t.studentId, t.evaluationId),
    index("results_student_id_idx").on(t.studentId),
    index("results_evaluation_id_idx").on(t.evaluationId),
  ]
);

export const insertEvaluationSchema = createInsertSchema(evaluationsTable).omit({ createdAt: true });
export const insertQuestionSchema = createInsertSchema(questionsTable);
export const insertEvaluationResultSchema = createInsertSchema(evaluationResultsTable).omit({ submittedAt: true });

export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type InsertEvaluationResult = z.infer<typeof insertEvaluationResultSchema>;
export type Evaluation = typeof evaluationsTable.$inferSelect;
export type Question = typeof questionsTable.$inferSelect;
export type EvaluationResult = typeof evaluationResultsTable.$inferSelect;
