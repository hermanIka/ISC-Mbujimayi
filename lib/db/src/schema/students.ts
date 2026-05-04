import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { filieresTable } from "./filieres";

export const studentsTable = pgTable(
  "students",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    numEtudiant: text("num_etudiant").unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone"),
    birthDate: text("birth_date"),
    address: text("address"),
    filiereId: text("filiere_id").references(() => filieresTable.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("students_filiere_id_idx").on(t.filiereId),
    index("students_user_id_idx").on(t.userId),
  ]
);

export const insertStudentSchema = createInsertSchema(studentsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
