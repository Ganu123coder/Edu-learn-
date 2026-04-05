import { pgTable, serial, timestamp, integer, numeric, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { coursesTable } from "./courses";

export const enrollmentsTable = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => usersTable.id),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  progressPercentage: numeric("progress_percentage", { precision: 5, scale: 2 }).notNull().default("0"),
  completionStatus: text("completion_status").notNull().default("in_progress"),
  completedLessons: text("completed_lessons").notNull().default("[]"),
  enrollmentDate: timestamp("enrollment_date", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEnrollmentSchema = createInsertSchema(enrollmentsTable).omit({
  id: true,
  enrollmentDate: true,
});
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
