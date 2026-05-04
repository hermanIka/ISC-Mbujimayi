import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chatMessagesTable = pgTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    role: text("role").notNull().$type<"user" | "assistant">(),
    content: text("content").notNull(),
    usedAI: boolean("used_ai").notNull().default(false),
    sessionId: text("session_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("chat_messages_user_id_idx").on(t.userId),
    index("chat_messages_session_id_idx").on(t.sessionId),
  ]
);

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({
  createdAt: true,
});
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
