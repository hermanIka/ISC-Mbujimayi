import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

export async function getCallerDbUser(req: Request) {
  const { userId } = getAuth(req);
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  return user ?? null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { userId } = getAuth(req);
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
