import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, enrollmentsTable, coursesTable, usersTable, lessonsTable } from "@workspace/db";
import { EnrollBody, UpdateProgressBody, UpdateProgressParams } from "@workspace/api-zod";
import { authenticate, requireRole } from "../middlewares/authenticate";

const router: IRouter = Router();

async function buildEnrollmentData(enrollment: typeof enrollmentsTable.$inferSelect) {
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, enrollment.courseId));
  const [trainer] = course ? await db.select().from(usersTable).where(eq(usersTable.id, course.trainerId)) : [null];

  const completedLessons = JSON.parse(enrollment.completedLessons || "[]") as number[];

  return {
    id: enrollment.id,
    studentId: enrollment.studentId,
    courseId: enrollment.courseId,
    courseTitle: course?.title ?? "Unknown Course",
    courseThumbnail: course?.thumbnail ?? null,
    trainerName: trainer?.name ?? "Unknown Trainer",
    progressPercentage: parseFloat(enrollment.progressPercentage ?? "0"),
    completionStatus: enrollment.completionStatus as "in_progress" | "completed",
    completedLessons,
    enrollmentDate: enrollment.enrollmentDate.toISOString(),
  };
}

router.get("/enrollments", authenticate, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const role = req.user!.role;

  let enrollments;
  if (role === "student") {
    enrollments = await db.select().from(enrollmentsTable)
      .where(eq(enrollmentsTable.studentId, userId));
  } else if (role === "trainer") {
    const trainerCourses = await db.select().from(coursesTable)
      .where(eq(coursesTable.trainerId, userId));
    const courseIds = trainerCourses.map(c => c.id);
    if (courseIds.length === 0) {
      res.json([]);
      return;
    }
    enrollments = await db.select().from(enrollmentsTable);
    enrollments = enrollments.filter(e => courseIds.includes(e.courseId));
  } else {
    enrollments = await db.select().from(enrollmentsTable);
  }

  const result = await Promise.all(enrollments.map(buildEnrollmentData));
  res.json(result);
});

router.post("/enrollments", authenticate, requireRole("student"), async (req, res): Promise<void> => {
  const parsed = EnrollBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { courseId } = parsed.data;
  const studentId = req.user!.userId;

  const existing = await db.select().from(enrollmentsTable)
    .where(and(
      eq(enrollmentsTable.courseId, courseId),
      eq(enrollmentsTable.studentId, studentId)
    ));

  if (existing.length > 0) {
    res.status(400).json({ error: "Already enrolled in this course" });
    return;
  }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const [enrollment] = await db.insert(enrollmentsTable).values({
    studentId,
    courseId,
    progressPercentage: "0",
    completionStatus: "in_progress",
    completedLessons: "[]",
  }).returning();

  const data = await buildEnrollmentData(enrollment);
  res.status(201).json(data);
});

router.patch("/enrollments/:id/progress", authenticate, requireRole("student"), async (req, res): Promise<void> => {
  const params = UpdateProgressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid enrollment ID" });
    return;
  }

  const parsed = UpdateProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [enrollment] = await db.select().from(enrollmentsTable)
    .where(and(
      eq(enrollmentsTable.id, params.data.id),
      eq(enrollmentsTable.studentId, req.user!.userId)
    ));

  if (!enrollment) {
    res.status(404).json({ error: "Enrollment not found" });
    return;
  }

  const completedLessons = JSON.parse(enrollment.completedLessons || "[]") as number[];

  if (parsed.data.completed && !completedLessons.includes(parsed.data.lessonId)) {
    completedLessons.push(parsed.data.lessonId);
  } else if (!parsed.data.completed) {
    const idx = completedLessons.indexOf(parsed.data.lessonId);
    if (idx > -1) completedLessons.splice(idx, 1);
  }

  const totalLessons = await db.select().from(lessonsTable)
    .where(eq(lessonsTable.courseId, enrollment.courseId));

  const progressPercentage = totalLessons.length > 0
    ? (completedLessons.length / totalLessons.length) * 100
    : 0;

  const completionStatus = progressPercentage >= 100 ? "completed" : "in_progress";

  const [updated] = await db.update(enrollmentsTable)
    .set({
      completedLessons: JSON.stringify(completedLessons),
      progressPercentage: String(progressPercentage),
      completionStatus,
    })
    .where(eq(enrollmentsTable.id, params.data.id))
    .returning();

  const data = await buildEnrollmentData(updated);
  res.json(data);
});

export default router;
