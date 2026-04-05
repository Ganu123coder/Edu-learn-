import { Router, type IRouter } from "express";
import { eq, and, ilike, avg, count, sql } from "drizzle-orm";
import { db, coursesTable, usersTable, lessonsTable, courseRatingsTable, enrollmentsTable } from "@workspace/db";
import {
  CreateCourseBody,
  UpdateCourseBody,
  GetCourseParams,
  UpdateCourseParams,
  DeleteCourseParams,
  CreateLessonParams,
  CreateLessonBody,
  RateCourseParams,
  RateCourseBody,
  ListCoursesQueryParams,
} from "@workspace/api-zod";
import { authenticate, requireRole } from "../middlewares/authenticate";

const router: IRouter = Router();

async function buildCourseData(course: typeof coursesTable.$inferSelect) {
  const [trainer] = await db.select().from(usersTable).where(eq(usersTable.id, course.trainerId));
  const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, course.id));
  const ratings = await db.select().from(courseRatingsTable).where(eq(courseRatingsTable.courseId, course.id));
  const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.courseId, course.id));

  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    trainerId: course.trainerId,
    trainerName: trainer?.name ?? "Unknown",
    thumbnail: course.thumbnail,
    price: parseFloat(course.price ?? "0"),
    enrolledCount: enrollments.length,
    rating: Math.round(avgRating * 10) / 10,
    ratingCount: ratings.length,
    lessonCount: lessons.length,
    isPublished: course.isPublished,
    createdAt: course.createdAt.toISOString(),
  };
}

router.get("/courses", async (req, res): Promise<void> => {
  const params = ListCoursesQueryParams.safeParse(req.query);

  let allCourses = await db.select().from(coursesTable).where(eq(coursesTable.isPublished, true));

  if (params.success && params.data.trainerId) {
    allCourses = allCourses.filter(c => c.trainerId === params.data.trainerId);
  }
  if (params.success && params.data.category) {
    allCourses = allCourses.filter(c => c.category === params.data.category);
  }
  if (params.success && params.data.search) {
    const search = params.data.search.toLowerCase();
    allCourses = allCourses.filter(c =>
      c.title.toLowerCase().includes(search) || c.description.toLowerCase().includes(search)
    );
  }

  const result = await Promise.all(allCourses.map(buildCourseData));
  res.json(result);
});

router.post("/courses", authenticate, requireRole("trainer", "admin"), async (req, res): Promise<void> => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [course] = await db.insert(coursesTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
    trainerId: req.user!.userId,
  }).returning();

  const data = await buildCourseData(course);
  res.status(201).json(data);
});

router.get("/courses/:id", async (req, res): Promise<void> => {
  const params = GetCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, params.data.id));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const data = await buildCourseData(course);
  const lessons = await db.select().from(lessonsTable)
    .where(eq(lessonsTable.courseId, course.id))
    .orderBy(lessonsTable.orderIndex);

  const ratings = await db.select().from(courseRatingsTable).where(eq(courseRatingsTable.courseId, course.id));
  const ratingStudentIds = ratings.map(r => r.studentId);
  const students = ratingStudentIds.length > 0
    ? await db.select().from(usersTable).where(sql`${usersTable.id} = ANY(${ratingStudentIds})`)
    : [];

  const studentMap = new Map(students.map(s => [s.id, s.name]));

  res.json({
    ...data,
    lessons: lessons.map(l => ({
      id: l.id,
      courseId: l.courseId,
      title: l.title,
      videoUrl: l.videoUrl,
      pdfUrl: l.pdfUrl,
      duration: l.duration,
      orderIndex: l.orderIndex,
      moduleTitle: l.moduleTitle,
    })),
    ratings: ratings.map(r => ({
      id: r.id,
      courseId: r.courseId,
      studentId: r.studentId,
      studentName: studentMap.get(r.studentId) ?? "Student",
      rating: r.rating,
      review: r.review,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

router.patch("/courses/:id", authenticate, async (req, res): Promise<void> => {
  const params = UpdateCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, params.data.id));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  if (req.user!.role !== "admin" && course.trainerId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = UpdateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.price !== undefined) updateData.price = String(parsed.data.price);

  const [updated] = await db.update(coursesTable)
    .set(updateData)
    .where(eq(coursesTable.id, params.data.id))
    .returning();

  const data = await buildCourseData(updated);
  res.json(data);
});

router.delete("/courses/:id", authenticate, async (req, res): Promise<void> => {
  const params = DeleteCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, params.data.id));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  if (req.user!.role !== "admin" && course.trainerId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(coursesTable).where(eq(coursesTable.id, params.data.id));
  res.sendStatus(204);
});

router.post("/courses/:id/lessons", authenticate, requireRole("trainer", "admin"), async (req, res): Promise<void> => {
  const params = CreateLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  const parsed = CreateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, params.data.id));
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  if (req.user!.role !== "admin" && course.trainerId !== req.user!.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [lesson] = await db.insert(lessonsTable).values({
    courseId: params.data.id,
    ...parsed.data,
    orderIndex: parsed.data.orderIndex ?? 0,
  }).returning();

  res.status(201).json({
    id: lesson.id,
    courseId: lesson.courseId,
    title: lesson.title,
    videoUrl: lesson.videoUrl,
    pdfUrl: lesson.pdfUrl,
    duration: lesson.duration,
    orderIndex: lesson.orderIndex,
    moduleTitle: lesson.moduleTitle,
  });
});

router.post("/courses/:id/rate", authenticate, requireRole("student"), async (req, res): Promise<void> => {
  const params = RateCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  const parsed = RateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const enrollment = await db.select().from(enrollmentsTable)
    .where(and(
      eq(enrollmentsTable.courseId, params.data.id),
      eq(enrollmentsTable.studentId, req.user!.userId)
    ));

  if (enrollment.length === 0) {
    res.status(403).json({ error: "You must be enrolled in this course to rate it" });
    return;
  }

  const existing = await db.select().from(courseRatingsTable)
    .where(and(
      eq(courseRatingsTable.courseId, params.data.id),
      eq(courseRatingsTable.studentId, req.user!.userId)
    ));

  let rating;
  if (existing.length > 0) {
    [rating] = await db.update(courseRatingsTable)
      .set({ rating: parsed.data.rating, review: parsed.data.review })
      .where(eq(courseRatingsTable.id, existing[0].id))
      .returning();
  } else {
    [rating] = await db.insert(courseRatingsTable).values({
      courseId: params.data.id,
      studentId: req.user!.userId,
      rating: parsed.data.rating,
      review: parsed.data.review,
    }).returning();
  }

  const [student] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));

  res.json({
    id: rating.id,
    courseId: rating.courseId,
    studentId: rating.studentId,
    studentName: student?.name ?? "Student",
    rating: rating.rating,
    review: rating.review,
    createdAt: rating.createdAt.toISOString(),
  });
});

export default router;
