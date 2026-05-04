import { Router, type IRouter } from "express";
import { eq, ilike, or, and } from "drizzle-orm";
import { db, usersTable, roleEnum } from "@workspace/db";
import { getAuth, clerkClient } from "@clerk/express";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import {
  GetCurrentUserResponse,
  UpdateCurrentUserBody,
  ListUsersQueryParams,
  ListUsersResponse,
  GetUserByIdParams,
  GetUserByIdResponse,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";

const router: IRouter = Router();

async function getOrCreateUser(clerkId: string, email: string) {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  if (existing) return existing;
  const [created] = await db
    .insert(usersTable)
    .values({ id: nanoid(), clerkId, email, role: "VISITOR" })
    .returning();
  return created;
}

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const email = (getAuth(req).sessionClaims?.email as string | undefined) ?? "";
  const user = await getOrCreateUser(userId, email as string);
  try {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: user.role },
    });
  } catch {
  }
  res.json(GetCurrentUserResponse.parse(user));
});

router.put("/users/me", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = UpdateCurrentUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId));
  if (!existing[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.clerkId, userId))
    .returning();
  res.json(GetCurrentUserResponse.parse(updated));
});

router.get("/users", requireAdmin, async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { page = 1, pageSize = 20, role, search } = params.data;
  const conditions = [
    role ? eq(usersTable.role, role as typeof roleEnum.enumValues[number]) : undefined,
    search
      ? or(
          ilike(usersTable.firstName, `%${search}%`),
          ilike(usersTable.lastName, `%${search}%`),
          ilike(usersTable.email, `%${search}%`),
        )
      : undefined,
  ].filter((c): c is NonNullable<typeof c> => c != null);
  const offset = (page - 1) * pageSize;
  const whereClause = conditions.length === 0 ? undefined : and(...conditions);
  const users = await db
    .select()
    .from(usersTable)
    .where(whereClause)
    .limit(pageSize)
    .offset(offset);
  const total = users.length;
  res.json(
    ListUsersResponse.parse({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }),
  );
});

router.get("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = GetUserByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetUserByIdResponse.parse(user));
});

router.put("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, params.data.id))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (user.clerkId && parsed.data.role) {
    try {
      await clerkClient.users.updateUserMetadata(user.clerkId, {
        publicMetadata: { role: user.role },
      });
    } catch {
    }
  }
  res.json(UpdateUserResponse.parse(user));
});

export default router;
