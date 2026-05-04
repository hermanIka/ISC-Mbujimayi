import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const filiereLevelEnum = pgEnum("filiere_level", [
  "LICENCE",
  "MASTER",
  "DOCTORAT",
]);

export const filieresTable = pgTable("filieres", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  duration: integer("duration").notNull(),
  level: filiereLevelEnum("level").notNull().default("LICENCE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFiliereSchema = createInsertSchema(filieresTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertFiliere = z.infer<typeof insertFiliereSchema>;
export type Filiere = typeof filieresTable.$inferSelect;
