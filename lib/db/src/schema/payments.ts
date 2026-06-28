import { pgTable, text, timestamp, pgEnum, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const paymentStatusEnum = pgEnum("payment_status", [
  "INITIATED",
  "PENDING",
  "CONFIRMED",
  "FAILED",
  "CANCELLED",
]);
export const paymentTypeEnum = pgEnum("payment_type", [
  "INSCRIPTION_FEE",
  "COURSE_FEE",
  "EXAM_FEE",
  "OTHER",
]);
export const mobileOperatorEnum = pgEnum("mobile_operator", [
  "VODACOM_MONEY",
  "AIRTEL_MONEY",
  "ORANGE_MONEY",
]);

export const paymentsTable = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("CDF"),
    type: paymentTypeEnum("type").notNull(),
    operator: mobileOperatorEnum("operator").notNull(),
    phoneNumber: text("phone_number").notNull(),
    status: paymentStatusEnum("status").notNull().default("INITIATED"),
    reference: text("reference").notNull().unique(),
    operatorRef: text("operator_ref"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("payments_student_id_idx").on(t.studentId),
    index("payments_status_idx").on(t.status),
    index("payments_reference_idx").on(t.reference),
  ]
);

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
