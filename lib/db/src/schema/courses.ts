import { pgTable, text, integer, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teachersTable } from "./teachers";
import { filieresTable } from "./filieres";

export const courseStatusEnum = pgEnum("course_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const chapterTypeEnum = pgEnum("chapter_type", ["VIDEO", "PDF", "PRESENTATION", "TEXT"]);

export const coursesTable = pgTable(
  "courses",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    thumbnail: text("thumbnail"),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachersTable.id),
    filiereId: text("filiere_id").references(() => filieresTable.id),
    status: courseStatusEnum("status").notNull().default("DRAFT"),
    level: text("level"),
    duration: integer("duration"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("courses_teacher_id_idx").on(t.teacherId),
    index("courses_filiere_id_idx").on(t.filiereId),
    index("courses_status_idx").on(t.status),
  ]
);

export const modulesTable = pgTable(
  "modules",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("modules_course_id_idx").on(t.courseId)]
);

export const chaptersTable = pgTable(
  "chapters",
  {
    id: text("id").primaryKey(),
    moduleId: text("module_id")
      .notNull()
      .references(() => modulesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: chapterTypeEnum("type").notNull(),
    content: text("content"),
    duration: integer("duration"),
    order: integer("order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chapters_module_id_idx").on(t.moduleId)]
);

export const insertCourseSchema = createInsertSchema(coursesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const insertModuleSchema = createInsertSchema(modulesTable).omit({ createdAt: true });
export const insertChapterSchema = createInsertSchema(chaptersTable).omit({ createdAt: true });

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Course = typeof coursesTable.$inferSelect;
export type Module = typeof modulesTable.$inferSelect;
export type Chapter = typeof chaptersTable.$inferSelect;
