import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";
import { usersTable } from "./users";

export const forumPostsTable = pgTable(
  "forum_posts",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => coursesTable.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => usersTable.id),
    content: text("content").notNull(),
    isPinned: boolean("is_pinned").notNull().default(false),
    parentId: text("parent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("forum_posts_course_id_idx").on(t.courseId),
    index("forum_posts_parent_id_idx").on(t.parentId),
    index("forum_posts_author_id_idx").on(t.authorId),
  ]
);

export const insertForumPostSchema = createInsertSchema(forumPostsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumPost = typeof forumPostsTable.$inferSelect;
