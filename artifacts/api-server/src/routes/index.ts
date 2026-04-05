import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import coursesRouter from "./courses";
import enrollmentsRouter from "./enrollments";
import attendanceRouter from "./attendance";
import aiRouter from "./ai";
import statsRouter from "./stats";
import categoriesRouter from "./categories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(coursesRouter);
router.use(enrollmentsRouter);
router.use(attendanceRouter);
router.use(aiRouter);
router.use(statsRouter);
router.use(categoriesRouter);

export default router;
