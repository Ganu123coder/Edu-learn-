import { Router, type IRouter } from "express";
import { db, categoriesTable, enrollmentsTable, coursesTable } from "@workspace/db";
import { CreateCategoryBody } from "@workspace/api-zod";
import { authenticate, requireRole } from "../middlewares/authenticate";
import { eq, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/categories", async (req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable);

  const courseCounts = await db
    .select({ category: coursesTable.category, count: count() })
    .from(coursesTable)
    .groupBy(coursesTable.category);

  const countMap = new Map(courseCounts.map(c => [c.category, c.count]));

  const result = cats.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    courseCount: countMap.get(c.name) ?? 0,
  }));

  res.json(result);
});

router.post("/categories", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();

  res.status(201).json({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    courseCount: 0,
  });
});

export default router;
