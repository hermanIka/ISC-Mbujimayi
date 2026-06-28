import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Auth bypassed for development — Clerk will be re-enabled later
const clerkEnabled = false;

export type UserRole =
  | "VISITOR"
  | "STUDENT"
  | "TEACHER"
  | "ACADEMIC_SERVICE"
  | "FINANCIAL_SERVICE"
  | "ADMIN"
  | "DIRECTOR";

declare global {
  namespace Express {
    interface Request {
      dbUser?: typeof usersTable.$inferSelect;
    }
  }
}

function safeGetUserId(req: Request): string | null {
  if (!clerkEnabled) return null;
  try {
    const { userId } = getAuth(req);
    return userId ?? null;
  } catch {
    return null;
  }
}

export async function getCallerDbUser(req: Request) {
  if (!clerkEnabled) {
    // Dev mode: honour X-Demo-User-Id header for persona switching
    const demoId = req.headers["x-demo-user-id"];
    if (demoId && typeof demoId === "string" && demoId.trim()) {
      const [demoUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, demoId.trim()))
        .limit(1);
      if (demoUser) return demoUser;
    }
    // Fallback: first ADMIN user
    const [adminUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, "ADMIN"))
      .limit(1);
    return adminUser ?? null;
  }
  const userId = safeGetUserId(req);
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  return user ?? null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!clerkEnabled) { next(); return; }
  const userId = safeGetUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!clerkEnabled) { next(); return; }

    const userId = safeGetUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId));

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (!roles.includes(user.role as UserRole)) {
      res.status(403).json({ error: `Access denied. Required role: ${roles.join(" or ")}` });
      return;
    }

    req.dbUser = user;
    next();
  };
}

export const requireAdmin = requireRole("ADMIN", "DIRECTOR");
export const requireAcademic = requireRole("ACADEMIC_SERVICE", "ADMIN", "DIRECTOR");
export const requireFinancial = requireRole("FINANCIAL_SERVICE", "ADMIN", "DIRECTOR");
export const requireTeacher = requireRole("TEACHER", "ADMIN", "DIRECTOR");
export const requireStudent = requireRole("STUDENT", "ADMIN", "DIRECTOR");
export const requireStaff = requireRole(
  "ACADEMIC_SERVICE",
  "FINANCIAL_SERVICE",
  "ADMIN",
  "DIRECTOR",
);
