import { pgTable, serial, timestamp, integer, text, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const learningPlansTable = pgTable("learning_plans", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => usersTable.id).unique(),
  careerGoal: text("career_goal").notNull(),
  skillLevel: text("skill_level").notNull(),
  hoursPerDay: numeric("hours_per_day", { precision: 4, scale: 1 }).notNull(),
  duration: integer("duration").notNull(),
  roadmap: text("roadmap").notNull().default("[]"),
  recommendedCourseIds: text("recommended_course_ids").notNull().default("[]"),
  milestones: text("milestones").notNull().default("[]"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLearningPlanSchema = createInsertSchema(learningPlansTable).omit({
  id: true,
  createdAt: true,
});
export type InsertLearningPlan = z.infer<typeof insertLearningPlanSchema>;
export type LearningPlan = typeof learningPlansTable.$inferSelect;
