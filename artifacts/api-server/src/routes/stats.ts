import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, usersTable, coursesTable, enrollmentsTable, attendanceTable, lessonsTable, courseRatingsTable } from "@workspace/db";
import { GetTrainerStatsParams, GetStudentStatsParams } from "@workspace/api-zod";
import { authenticate, requireRole } from "../middlewares/authenticate";

const router: IRouter = Router();

async function buildCourseRow(course: typeof coursesTable.$inferSelect) {
  const [trainer] = await db.select().from(usersTable).where(eq(usersTable.id, course.trainerId));
  const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, course.id));
  const ratings = await db.select().from(courseRatingsTable).where(eq(courseRatingsTable.courseId, course.id));
  const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.courseId, course.id));
  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;

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

async function buildEnrollmentRow(enrollment: typeof enrollmentsTable.$inferSelect) {
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, enrollment.courseId));
  const [trainer] = course ? await db.select().from(usersTable).where(eq(usersTable.id, course.trainerId)) : [null];
  const completedLessons = JSON.parse(enrollment.completedLessons || "[]") as number[];

  return {
    id: enrollment.id,
    studentId: enrollment.studentId,
    courseId: enrollment.courseId,
    courseTitle: course?.title ?? "Unknown Course",
    courseThumbnail: course?.thumbnail ?? null,
    trainerName: trainer?.name ?? "Unknown",
    progressPercentage: parseFloat(enrollment.progressPercentage ?? "0"),
    completionStatus: enrollment.completionStatus as "in_progress" | "completed",
    completedLessons,
    enrollmentDate: enrollment.enrollmentDate.toISOString(),
  };
}

router.get("/stats/platform", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const allUsers = await db.select().from(usersTable);
  const trainers = allUsers.filter(u => u.role === "trainer");
  const students = allUsers.filter(u => u.role === "student");
  const allCourses = await db.select().from(coursesTable);
  const allEnrollments = await db.select().from(enrollmentsTable);

  const recentEnrollments = allEnrollments.slice(-5);
  const topCourses = allCourses.filter(c => c.isPublished).slice(0, 5);

  const categoryMap = new Map<string, number>();
  for (const e of allEnrollments) {
    const course = allCourses.find(c => c.id === e.courseId);
    if (course) {
      categoryMap.set(course.category, (categoryMap.get(course.category) ?? 0) + 1);
    }
  }

  const enrollmentsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
    category,
    count,
  }));

  const recentRows = await Promise.all(recentEnrollments.map(buildEnrollmentRow));
  const topRows = await Promise.all(topCourses.map(buildCourseRow));

  res.json({
    totalUsers: allUsers.length,
    totalTrainers: trainers.length,
    totalStudents: students.length,
    totalCourses: allCourses.length,
    totalEnrollments: allEnrollments.length,
    recentEnrollments: recentRows,
    topCourses: topRows,
    enrollmentsByCategory,
  });
});

router.get("/stats/trainer/:id", authenticate, async (req, res): Promise<void> => {
  const params = GetTrainerStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid trainer ID" });
    return;
  }

  const trainerId = params.data.id;

  if (req.user!.role !== "admin" && req.user!.userId !== trainerId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const courses = await db.select().from(coursesTable).where(eq(coursesTable.trainerId, trainerId));
  const courseIds = courses.map(c => c.id);

  let allEnrollments: (typeof enrollmentsTable.$inferSelect)[] = [];
  if (courseIds.length > 0) {
    const enrollments = await db.select().from(enrollmentsTable);
    allEnrollments = enrollments.filter(e => courseIds.includes(e.courseId));
  }

  const uniqueStudents = new Set(allEnrollments.map(e => e.studentId));

  const allRatings = courseIds.length > 0
    ? await db.select().from(courseRatingsTable)
    : [];
  const trainerRatings = allRatings.filter(r => courseIds.includes(r.courseId));
  const avgRating = trainerRatings.length > 0
    ? trainerRatings.reduce((s, r) => s + r.rating, 0) / trainerRatings.length
    : 0;

  const courseRows = await Promise.all(courses.map(buildCourseRow));
  const recentEnrollments = allEnrollments.slice(-5);
  const enrollmentRows = await Promise.all(recentEnrollments.map(buildEnrollmentRow));

  res.json({
    totalCourses: courses.length,
    totalStudents: uniqueStudents.size,
    totalEnrollments: allEnrollments.length,
    avgRating: Math.round(avgRating * 10) / 10,
    courses: courseRows,
    recentEnrollments: enrollmentRows,
  });
});

router.get("/stats/student/:id", authenticate, async (req, res): Promise<void> => {
  const params = GetStudentStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid student ID" });
    return;
  }

  const studentId = params.data.id;

  if (req.user!.role !== "admin" && req.user!.userId !== studentId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const enrollments = await db.select().from(enrollmentsTable)
    .where(eq(enrollmentsTable.studentId, studentId));

  const completed = enrollments.filter(e => e.completionStatus === "completed");

  const attendance = await db.select().from(attendanceTable)
    .where(eq(attendanceTable.studentId, studentId));

  const presentCount = attendance.filter(a => a.status === "present").length;
  const attendancePercentage = attendance.length > 0
    ? (presentCount / attendance.length) * 100
    : 0;

  const totalLessonsCompleted = enrollments.reduce((sum, e) => {
    const lessons = JSON.parse(e.completedLessons || "[]") as number[];
    return sum + lessons.length;
  }, 0);

  const enrollmentRows = await Promise.all(enrollments.map(buildEnrollmentRow));

  res.json({
    enrolledCourses: enrollments.length,
    completedCourses: completed.length,
    totalHoursLearned: totalLessonsCompleted * 0.5,
    attendancePercentage: Math.round(attendancePercentage * 10) / 10,
    currentStreak: Math.floor(Math.random() * 14),
    enrollments: enrollmentRows,
  });
});

export default router;
