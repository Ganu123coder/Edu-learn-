import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, learningPlansTable, coursesTable, usersTable } from "@workspace/db";
import { GenerateLearningPlanBody } from "@workspace/api-zod";
import { authenticate, requireRole } from "../middlewares/authenticate";

const router: IRouter = Router();

function generateMockPlan(
  careerGoal: string,
  skillLevel: string,
  hoursPerDay: number,
  duration: number,
  preferredTechnologies: string[],
  learningStyle: string
) {
  const weeks = Math.ceil(duration / 7);

  const roadmapTemplates: Record<string, Array<{ weekLabel: string; topics: string[]; recommendedCourse: string }>> = {
    "Full Stack Developer": [
      { weekLabel: "HTML & CSS Fundamentals", topics: ["HTML5 structure", "CSS layouts", "Flexbox & Grid", "Responsive design"], recommendedCourse: "Web Development Basics" },
      { weekLabel: "JavaScript Core", topics: ["Variables and types", "Functions and closures", "DOM manipulation", "Event handling"], recommendedCourse: "JavaScript Bootcamp" },
      { weekLabel: "Advanced JavaScript", topics: ["ES6+ features", "Async/Await", "Promises", "Fetch API"], recommendedCourse: "Modern JavaScript" },
      { weekLabel: "React Fundamentals", topics: ["Components", "JSX", "Props & State", "Lifecycle hooks"], recommendedCourse: "React for Beginners" },
      { weekLabel: "React Advanced", topics: ["Context API", "Custom hooks", "React Query", "Performance"], recommendedCourse: "Advanced React" },
      { weekLabel: "Node.js & Express", topics: ["REST APIs", "Middleware", "Authentication", "Database integration"], recommendedCourse: "Node.js Bootcamp" },
      { weekLabel: "Database & Deployment", topics: ["SQL basics", "PostgreSQL", "CI/CD", "Cloud deployment"], recommendedCourse: "Database & DevOps" },
    ],
    "Data Scientist": [
      { weekLabel: "Python Fundamentals", topics: ["Python syntax", "Data types", "Control flow", "Functions"], recommendedCourse: "Python for Beginners" },
      { weekLabel: "Data Manipulation", topics: ["NumPy basics", "Pandas DataFrames", "Data cleaning", "Data wrangling"], recommendedCourse: "Data Analysis with Pandas" },
      { weekLabel: "Data Visualization", topics: ["Matplotlib", "Seaborn", "Plotly", "Dashboard creation"], recommendedCourse: "Data Visualization" },
      { weekLabel: "Statistics & Math", topics: ["Descriptive statistics", "Probability", "Hypothesis testing", "Regression"], recommendedCourse: "Statistics for Data Science" },
      { weekLabel: "Machine Learning", topics: ["Supervised learning", "Classification", "Regression models", "Model evaluation"], recommendedCourse: "Machine Learning Fundamentals" },
      { weekLabel: "Deep Learning", topics: ["Neural networks", "TensorFlow basics", "CNN architecture", "Transfer learning"], recommendedCourse: "Deep Learning with TensorFlow" },
      { weekLabel: "MLOps & Deployment", topics: ["Model serving", "APIs for ML", "Docker", "Cloud ML services"], recommendedCourse: "MLOps Essentials" },
    ],
    "Mobile Developer": [
      { weekLabel: "Programming Basics", topics: ["Variables", "Data structures", "OOP concepts", "Algorithms"], recommendedCourse: "Programming Fundamentals" },
      { weekLabel: "React Native Setup", topics: ["Expo setup", "JSX components", "Native components", "Styling"], recommendedCourse: "React Native for Beginners" },
      { weekLabel: "Navigation & State", topics: ["React Navigation", "Stack navigator", "Tab navigator", "State management"], recommendedCourse: "React Native Navigation" },
      { weekLabel: "APIs & Data", topics: ["REST APIs", "AsyncStorage", "SQLite", "Firebase integration"], recommendedCourse: "Mobile App Data" },
      { weekLabel: "Advanced Features", topics: ["Camera & media", "Location services", "Push notifications", "Animations"], recommendedCourse: "Advanced React Native" },
      { weekLabel: "Testing & Publishing", topics: ["Unit testing", "E2E testing", "App Store submission", "Play Store"], recommendedCourse: "Mobile App Publishing" },
    ],
  };

  const goalKey = Object.keys(roadmapTemplates).find(k =>
    careerGoal.toLowerCase().includes(k.toLowerCase().split(" ")[0])
  ) ?? "Full Stack Developer";

  const templates = roadmapTemplates[goalKey];
  const roadmap = [];

  for (let i = 0; i < weeks; i++) {
    const template = templates[i % templates.length];
    roadmap.push({
      week: i + 1,
      weekLabel: template.weekLabel,
      topics: template.topics,
      recommendedCourse: template.recommendedCourse,
      isCompleted: false,
    });
  }

  const milestones = [
    {
      id: 1,
      title: "Foundation Complete",
      description: "Complete all foundational topics",
      targetWeek: Math.ceil(weeks * 0.3),
      isCompleted: false,
    },
    {
      id: 2,
      title: "First Project Built",
      description: "Build and deploy your first project",
      targetWeek: Math.ceil(weeks * 0.6),
      isCompleted: false,
    },
    {
      id: 3,
      title: "Portfolio Ready",
      description: `${careerGoal} portfolio with 3 projects`,
      targetWeek: weeks,
      isCompleted: false,
    },
  ];

  return { roadmap, milestones };
}

router.post("/ai/generate-plan", authenticate, requireRole("student"), async (req, res): Promise<void> => {
  const parsed = GenerateLearningPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { careerGoal, skillLevel, hoursPerDay, duration, preferredTechnologies, learningStyle } = parsed.data;

  const { roadmap, milestones } = generateMockPlan(
    careerGoal,
    skillLevel,
    parseFloat(String(hoursPerDay)),
    duration,
    preferredTechnologies ?? [],
    learningStyle ?? "mixed"
  );

  const courses = await db.select().from(coursesTable).where(eq(coursesTable.isPublished, true));
  const recommendedIds = courses.slice(0, 3).map(c => c.id);

  const existing = await db.select().from(learningPlansTable)
    .where(eq(learningPlansTable.studentId, req.user!.userId));

  let plan;
  if (existing.length > 0) {
    [plan] = await db.update(learningPlansTable)
      .set({
        careerGoal,
        skillLevel,
        hoursPerDay: String(hoursPerDay),
        duration,
        roadmap: JSON.stringify(roadmap),
        recommendedCourseIds: JSON.stringify(recommendedIds),
        milestones: JSON.stringify(milestones),
      })
      .where(eq(learningPlansTable.studentId, req.user!.userId))
      .returning();
  } else {
    [plan] = await db.insert(learningPlansTable).values({
      studentId: req.user!.userId,
      careerGoal,
      skillLevel,
      hoursPerDay: String(hoursPerDay),
      duration,
      roadmap: JSON.stringify(roadmap),
      recommendedCourseIds: JSON.stringify(recommendedIds),
      milestones: JSON.stringify(milestones),
    }).returning();
  }

  res.json({
    id: plan.id,
    studentId: plan.studentId,
    careerGoal: plan.careerGoal,
    skillLevel: plan.skillLevel,
    hoursPerDay: parseFloat(String(plan.hoursPerDay)),
    duration: plan.duration,
    roadmap: JSON.parse(plan.roadmap),
    recommendedCourseIds: JSON.parse(plan.recommendedCourseIds),
    milestones: JSON.parse(plan.milestones),
    createdAt: plan.createdAt.toISOString(),
  });
});

router.get("/ai/my-plan", authenticate, requireRole("student"), async (req, res): Promise<void> => {
  const [plan] = await db.select().from(learningPlansTable)
    .where(eq(learningPlansTable.studentId, req.user!.userId));

  if (!plan) {
    res.status(404).json({ error: "No learning plan found" });
    return;
  }

  res.json({
    id: plan.id,
    studentId: plan.studentId,
    careerGoal: plan.careerGoal,
    skillLevel: plan.skillLevel,
    hoursPerDay: parseFloat(String(plan.hoursPerDay)),
    duration: plan.duration,
    roadmap: JSON.parse(plan.roadmap),
    recommendedCourseIds: JSON.parse(plan.recommendedCourseIds),
    milestones: JSON.parse(plan.milestones),
    createdAt: plan.createdAt.toISOString(),
  });
});

router.get("/ai/recommendations", authenticate, requireRole("student"), async (req, res): Promise<void> => {
  const enrollments = await db.select().from(coursesTable).where(eq(coursesTable.isPublished, true));
  const recommended = enrollments.slice(0, 6);

  const result = await Promise.all(recommended.map(async (course) => {
    const [trainer] = await db.select().from(usersTable).where(eq(usersTable.id, course.trainerId));
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      trainerId: course.trainerId,
      trainerName: trainer?.name ?? "Unknown",
      thumbnail: course.thumbnail,
      price: parseFloat(course.price ?? "0"),
      enrolledCount: 0,
      rating: 0,
      ratingCount: 0,
      lessonCount: 0,
      isPublished: course.isPublished,
      createdAt: course.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

export default router;
