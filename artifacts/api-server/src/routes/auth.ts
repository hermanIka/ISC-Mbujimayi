import { Router, type IRouter } from "express";
import { eq, and, like } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getAuth, clerkClient } from "@clerk/express";
import { requireAuth } from "../middlewares/auth";
import { SyncAuthUserResponse } from "@workspace/api-zod";
import { nanoid } from "nanoid";

const router: IRouter = Router();

async function getOrCreateUser(clerkId: string, email: string) {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  if (existing) return existing;

  // Check if there's a pre-registered user with the same email (clerkId starts with PREREG_)
  if (email && email.trim() !== "") {
    const [preReg] = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.email, email.trim()),
          like(usersTable.clerkId, "PREREG_%")
        )
      );
    if (preReg) {
      // Link the real Clerk ID to the pre-registered user
      const [linked] = await db
        .update(usersTable)
        .set({ clerkId })
        .where(eq(usersTable.id, preReg.id))
        .returning();
      return linked ?? preReg;
    }
  }

  const resolvedEmail =
    email && email.trim() !== "" ? email : `clerk_${clerkId}@placeholder.test`;
  const [created] = await db
    .insert(usersTable)
    .values({ id: nanoid(), clerkId, email: resolvedEmail, role: "VISITOR" })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [refetched] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  return refetched;
}

router.post("/auth/sync", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const email =
    (getAuth(req).sessionClaims?.email as string | undefined) ?? "";
  const user = await getOrCreateUser(userId, email);
  if (!user) {
    res.status(500).json({ error: "Failed to sync user" });
    return;
  }
  try {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: user.role },
    });
  } catch {
  }
  res.json(SyncAuthUserResponse.parse(user));
});

router.post("/auth/webhook", async (req, res): Promise<void> => {
  res.status(200).json({ received: true });
});

export default router;
