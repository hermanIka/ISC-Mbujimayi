import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import filieresRouter from "./filieres";
import studentsRouter from "./students";
import teachersRouter from "./teachers";
import inscriptionsRouter from "./inscriptions";
import coursesRouter from "./courses";
import enrollmentsRouter from "./enrollments";
import paymentsRouter from "./payments";
import certificatesRouter from "./certificates";
import evaluationsRouter from "./evaluations";
import forumRouter from "./forum";
import chatbotRouter from "./chatbot";
import analyticsRouter from "./analytics";
import preRegisterRouter from "./preRegister";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(filieresRouter);
router.use(studentsRouter);
router.use(teachersRouter);
router.use(inscriptionsRouter);
router.use(coursesRouter);
router.use(enrollmentsRouter);
router.use(paymentsRouter);
router.use(certificatesRouter);
router.use(evaluationsRouter);
router.use(forumRouter);
router.use(chatbotRouter);
router.use(analyticsRouter);
router.use(preRegisterRouter);

export default router;
