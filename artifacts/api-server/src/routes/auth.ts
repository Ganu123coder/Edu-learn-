import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { hashPassword, comparePassword, signToken } from "../lib/auth";
import { authenticate } from "../middlewares/authenticate";

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

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }

  const { name, email, password, role } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered", message: "An account with this email already exists" });
    return;
  }

  const hashedPassword = await hashPassword(password);
  const isApproved = role === "student";

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    password: hashedPassword,
    role,
    isApproved,
    isBlocked: false,
  }).returning();

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  res.status(201).json({ token, user: sanitizeUser(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials", message: "Email or password is incorrect" });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ error: "Account blocked", message: "Your account has been blocked" });
    return;
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    res.status(401).json({ error: "Invalid credentials", message: "Email or password is incorrect" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  res.json({ token, user: sanitizeUser(user) });
});

router.get("/auth/me", authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(sanitizeUser(user));
});

export default router;
