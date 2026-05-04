import { pgTable, text, json, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const inscriptionStatusEnum = pgEnum("inscription_status", [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
]);

export const inscriptionsTable = pgTable(
  "inscriptions",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    status: inscriptionStatusEnum("status").notNull().default("PENDING"),
    documents: json("documents").notNull().$type<Array<{
      type: string;
      url: string;
      name: string;
      uploadedAt: string;
    }>>(),
    notes: text("notes"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("inscriptions_student_id_idx").on(t.studentId),
    index("inscriptions_status_idx").on(t.status),
  ]
);

export const insertInscriptionSchema = createInsertSchema(inscriptionsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertInscription = z.infer<typeof insertInscriptionSchema>;
export type Inscription = typeof inscriptionsTable.$inferSelect;
