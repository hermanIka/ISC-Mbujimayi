import { pgTable, text, timestamp, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { coursesTable } from "./courses";

export const certificatesTable = pgTable(
  "certificates",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => studentsTable.id),
    courseId: text("course_id")
      .notNull()
      .references(() => coursesTable.id),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    hash: text("hash").notNull().unique(),
    pdfUrl: text("pdf_url"),
  },
  (t) => [
    unique("certificates_student_course_unique").on(t.studentId, t.courseId),
    index("certificates_student_id_idx").on(t.studentId),
    index("certificates_hash_idx").on(t.hash),
  ]
);

export const insertCertificateSchema = createInsertSchema(certificatesTable).omit({
  issuedAt: true,
});
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificatesTable.$inferSelect;
