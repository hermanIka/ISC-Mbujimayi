import { Router, type IRouter } from "express";
import { eq, isNull, count } from "drizzle-orm";
import { db, forumPostsTable, usersTable, type ForumPost } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import {
  ListForumPostsParams,
  ListForumPostsQueryParams,
  CreateForumPostParams,
  CreateForumPostBody,
  UpdateForumPostParams,
  UpdateForumPostBody,
  DeleteForumPostParams,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";

const router: IRouter = Router();

async function enrichPost(post: ForumPost): Promise<Record<string, unknown>> {
  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, post.authorId));
  const replies = await db
    .select()
    .from(forumPostsTable)
    .where(eq(forumPostsTable.parentId, post.id));
  const [countRow] = await db.select({ count: count() }).from(forumPostsTable).where(eq(forumPostsTable.parentId, post.id));
  return {
    ...post,
    authorName: author ? `${author.firstName ?? ""} ${author.lastName ?? ""}`.trim() || author.email : "Anonymous",
    replyCount: Number(countRow?.count ?? 0),
    replies: await Promise.all(replies.map(enrichPost)),
  };
}

router.get("/courses/:courseId/forum", async (req, res): Promise<void> => {
  const params = ListForumPostsParams.safeParse(req.params);
  const query = ListForumPostsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const page = Number(query.data?.page ?? 1);
  const pageSize = Number(query.data?.pageSize ?? 20);
  const posts = await db
    .select()
    .from(forumPostsTable)
    .where(eq(forumPostsTable.courseId, params.data.courseId))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const topLevel = posts.filter(p => !p.parentId);
  const [totalRow] = await db.select({ count: count() }).from(forumPostsTable).where(eq(forumPostsTable.courseId, params.data.courseId));
  const total = Number(totalRow?.count ?? 0);
  const enriched = await Promise.all(topLevel.map(enrichPost));
  res.json({ posts: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

router.post("/courses/:courseId/forum", requireAuth, async (req, res): Promise<void> => {
  const params = CreateForumPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateForumPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const users = await db.select().from(usersTable).limit(1);
  const authorId = users[0]?.id ?? nanoid();
  const [post] = await db
    .insert(forumPostsTable)
    .values({
      id: nanoid(),
      courseId: params.data.courseId,
      authorId,
      content: parsed.data.content,
      parentId: parsed.data.parentId ?? null,
    })
    .returning();
  res.status(201).json(await enrichPost(post));
});

router.put("/forum/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateForumPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateForumPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [post] = await db
    .update(forumPostsTable)
    .set(parsed.data)
    .where(eq(forumPostsTable.id, params.data.id))
    .returning();
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(await enrichPost(post));
});

router.delete("/forum/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteForumPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(forumPostsTable).where(eq(forumPostsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
