import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const staffRegStatusEnum = pgEnum("staff_reg_status", ["PENDING", "APPROVED", "REJECTED"]);

export const staffRegistrationsTable = pgTable("staff_registrations", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  matricule: text("matricule").notNull(),
  emailUniversitaire: text("email_universitaire").notNull(),
  roleStaff: text("role_staff").notNull(),
  status: staffRegStatusEnum("status").notNull().default("PENDING"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type StaffRegistration = typeof staffRegistrationsTable.$inferSelect;
export type InsertStaffRegistration = typeof staffRegistrationsTable.$inferInsert;
