import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, attendanceTable, usersTable, coursesTable } from "@workspace/db";
import { MarkAttendanceBody, ListAttendanceQueryParams } from "@workspace/api-zod";
import { authenticate, requireRole } from "../middlewares/authenticate";

const router: IRouter = Router();

async function buildAttendanceData(att: typeof attendanceTable.$inferSelect) {
  const [student] = await db.select().from(usersTable).where(eq(usersTable.id, att.studentId));
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, att.courseId));

  return {
    id: att.id,
    studentId: att.studentId,
    studentName: student?.name ?? "Unknown",
    courseId: att.courseId,
    courseTitle: course?.title ?? "Unknown Course",
    sessionDate: att.sessionDate,
    status: att.status as "present" | "absent",
    createdAt: att.createdAt.toISOString(),
  };
}

router.get("/attendance", authenticate, async (req, res): Promise<void> => {
  const params = ListAttendanceQueryParams.safeParse(req.query);
  const role = req.user!.role;
  const userId = req.user!.userId;

  let records = await db.select().from(attendanceTable);

  if (role === "student") {
    records = records.filter(r => r.studentId === userId);
  }
  if (params.success && params.data.courseId) {
    records = records.filter(r => r.courseId === params.data.courseId);
  }
  if (params.success && params.data.studentId && role !== "student") {
    records = records.filter(r => r.studentId === params.data.studentId);
  }

  const result = await Promise.all(records.map(buildAttendanceData));
  res.json(result);
});

router.post("/attendance", authenticate, requireRole("trainer", "admin"), async (req, res): Promise<void> => {
  const parsed = MarkAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(attendanceTable)
    .where(and(
      eq(attendanceTable.studentId, parsed.data.studentId),
      eq(attendanceTable.courseId, parsed.data.courseId),
      eq(attendanceTable.sessionDate, parsed.data.sessionDate)
    ));

  let att;
  if (existing.length > 0) {
    [att] = await db.update(attendanceTable)
      .set({ status: parsed.data.status })
      .where(eq(attendanceTable.id, existing[0].id))
      .returning();
  } else {
    [att] = await db.insert(attendanceTable).values({
      studentId: parsed.data.studentId,
      courseId: parsed.data.courseId,
      sessionDate: parsed.data.sessionDate,
      status: parsed.data.status,
    }).returning();
  }

  const data = await buildAttendanceData(att);
  res.status(201).json(data);
});

export default router;
