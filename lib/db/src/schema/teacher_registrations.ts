import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const teacherRegStatusEnum = pgEnum("teacher_reg_status", ["PENDING", "APPROVED", "REJECTED"]);

export const teacherRegistrationsTable = pgTable("teacher_registrations", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  matricule: text("matricule").notNull(),
  emailUniversitaire: text("email_universitaire").notNull(),
  status: teacherRegStatusEnum("status").notNull().default("PENDING"),
  notes: text("notes"),
  userId: text("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type TeacherRegistration = typeof teacherRegistrationsTable.$inferSelect;
export type InsertTeacherRegistration = typeof teacherRegistrationsTable.$inferInsert;
