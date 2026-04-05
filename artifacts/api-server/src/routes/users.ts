import { Router, type IRouter } from "express";
import { eq, ilike, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { UpdateUserBody, ListUsersQueryParams, GetUserParams, UpdateUserParams } from "@workspace/api-zod";
import { authenticate, requireRole } from "../middlewares/authenticate";

const router: IRouter = Router();

function sanitizeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePhoto: user.profilePhoto,
    isBlocked: user.isBlocked,
    isApproved: user.isApproved,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  let query = db.select().from(usersTable);

  const conditions = [];
  if (params.success && params.data.role) {
    conditions.push(eq(usersTable.role, params.data.role));
  }
  if (params.success && params.data.search) {
    conditions.push(ilike(usersTable.name, `%${params.data.search}%`));
  }

  let users;
  if (conditions.length > 0) {
    users = await db.select().from(usersTable).where(and(...conditions));
  } else {
    users = await db.select().from(usersTable);
  }

  res.json(users.map(sanitizeUser));
});

router.get("/users/:id", authenticate, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(sanitizeUser(user));
});

router.patch("/users/:id", authenticate, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const targetId = params.data.id;
  const requesterId = req.user!.userId;
  const requesterRole = req.user!.role;

  if (requesterRole !== "admin" && requesterId !== targetId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.profilePhoto) updateData.profilePhoto = parsed.data.profilePhoto;
  if (requesterRole === "admin") {
    if (parsed.data.isBlocked !== undefined) updateData.isBlocked = parsed.data.isBlocked;
    if (parsed.data.isApproved !== undefined) updateData.isApproved = parsed.data.isApproved;
  }

  const [user] = await db.update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, targetId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(sanitizeUser(user));
});

export default router;
