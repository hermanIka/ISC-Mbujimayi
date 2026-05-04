import { pgTable, text, integer, timestamp, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { coursesTable } from "./courses";
import { chaptersTable } from "./courses";

export const enrollmentsTable = pgTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    unique("enrollments_student_course_unique").on(t.studentId, t.courseId),
    index("enrollments_student_id_idx").on(t.studentId),
    index("enrollments_course_id_idx").on(t.courseId),
  ]
);

export const chapterProgressTable = pgTable(
  "chapter_progress",
  {
    id: text("id").primaryKey(),
    enrollmentId: text("enrollment_id")
      .notNull()
      .references(() => enrollmentsTable.id, { onDelete: "cascade" }),
    chapterId: text("chapter_id")
      .notNull()
      .references(() => chaptersTable.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    watchedSeconds: integer("watched_seconds"),
  },
  (t) => [
    unique("chapter_progress_unique").on(t.enrollmentId, t.chapterId),
    index("chapter_progress_enrollment_id_idx").on(t.enrollmentId),
  ]
);

export const insertEnrollmentSchema = createInsertSchema(enrollmentsTable).omit({
  enrolledAt: true,
});
export const insertChapterProgressSchema = createInsertSchema(chapterProgressTable);
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type InsertChapterProgress = z.infer<typeof insertChapterProgressSchema>;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
export type ChapterProgress = typeof chapterProgressTable.$inferSelect;
