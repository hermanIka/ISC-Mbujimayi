import { Router, type IRouter } from "express";
import { count, eq } from "drizzle-orm";
import {
  db,
  studentsTable,
  teachersTable,
  coursesTable,
  enrollmentsTable,
  paymentsTable,
  certificatesTable,
  inscriptionsTable,
  evaluationResultsTable,
  chapterProgressTable,
  modulesTable,
  chaptersTable,
} from "@workspace/db";
import { requireAuth, requireAcademic, requireFinancial, requireRole, getCallerDbUser } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/analytics/student", requireAuth, async (req, res): Promise<void> => {
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const [callerStudent] = await db.select().from(studentsTable).where(eq(studentsTable.userId, callerUser.id));
  if (!callerStudent) {
    res.json({ enrolledCourses: 0, completedCourses: 0, inProgressCourses: 0, certificates: 0, pendingPayments: 0, confirmedPayments: 0, totalAmountPaid: "0.00", upcomingEvaluations: 0, averageScore: null, courseProgress: [] });
    return;
  }
  const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.studentId, callerStudent.id));
  const enrolled = enrollments.length;
  let completed = 0;
  let inProgress = 0;
  const courseProgress: Array<{ courseId: string; courseTitle: string; progressPercent: number; enrolledAt: Date | null }> = [];

  for (const e of enrollments) {
    const modules = await db.select().from(modulesTable).where(eq(modulesTable.courseId, e.courseId));
    let totalChapters = 0;
    for (const mod of modules) {
      const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.moduleId, mod.id));
      totalChapters += chapters.length;
    }
    const done = await db.select().from(chapterProgressTable).where(eq(chapterProgressTable.enrollmentId, e.id));
    const completedCount = done.filter(d => d.completedAt).length;
    const progressPercent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;
    if (progressPercent >= 100) completed++;
    else if (progressPercent > 0) inProgress++;
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, e.courseId));
    if (course) {
      courseProgress.push({ courseId: e.courseId, courseTitle: course.title, progressPercent, enrolledAt: e.enrolledAt });
    }
  }

  const [certRow] = await db.select({ count: count() }).from(certificatesTable).where(eq(certificatesTable.studentId, callerStudent.id));
  const [pendingRow] = await db.select({ count: count() }).from(paymentsTable).where(eq(paymentsTable.studentId, callerStudent.id));
  const [confirmedRow] = await db.select({ count: count() }).from(paymentsTable).where(eq(paymentsTable.studentId, callerStudent.id));
  const confirmedPayments = await db.select().from(paymentsTable).where(eq(paymentsTable.studentId, callerStudent.id));
  const totalPaid = confirmedPayments.filter(p => p.status === "CONFIRMED").reduce((acc, p) => acc + Number(p.amount ?? 0), 0);

  res.json({
    enrolledCourses: enrolled,
    completedCourses: completed,
    inProgressCourses: inProgress,
    certificates: Number(certRow?.count ?? 0),
    pendingPayments: Number(pendingRow?.count ?? 0),
    confirmedPayments: Number(confirmedRow?.count ?? 0),
    totalAmountPaid: totalPaid.toFixed(2),
    upcomingEvaluations: 0,
    averageScore: null,
    courseProgress,
  });
});

router.get("/analytics/teacher", requireAuth, async (_req, res): Promise<void> => {
  const courses = await db.select().from(coursesTable);
  const published = courses.filter(c => c.status === "PUBLISHED").length;
  const [evalRow] = await db.select({ count: count() }).from(evaluationResultsTable);
  const results = await db.select().from(evaluationResultsTable);
  const avgScore = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + (r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0), 0) / results.length)
    : null;

  const courseEngagement = await Promise.all(
    courses.slice(0, 10).map(async (c) => {
      const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.courseId, c.id));
      return {
        courseId: c.id,
        courseTitle: c.title,
        enrolledStudents: enrollments.length,
        averageProgress: 0,
        completedStudents: enrollments.filter(e => e.completedAt).length,
      };
    }),
  );

  const [studentRow] = await db.select({ count: count() }).from(enrollmentsTable);
  res.json({
    totalCourses: courses.length,
    publishedCourses: published,
    totalStudents: Number(studentRow?.count ?? 0),
    totalEvaluations: Number(evalRow?.count ?? 0),
    averageScore: avgScore,
    courseEngagement,
  });
});

router.get("/analytics/academic", requireAcademic, async (_req, res): Promise<void> => {
  const inscriptions = await db.select().from(inscriptionsTable);
  const byStatus = {
    total: inscriptions.length,
    pending: inscriptions.filter(i => i.status === "PENDING").length,
    underReview: inscriptions.filter(i => i.status === "UNDER_REVIEW").length,
    approved: inscriptions.filter(i => i.status === "APPROVED").length,
    rejected: inscriptions.filter(i => i.status === "REJECTED").length,
  };

  const students = await db.select().from(studentsTable);
  const byFiliereMap: Record<string, { filiereName: string; studentCount: number }> = {};
  for (const s of students) {
    if (!s.filiereId) continue;
    if (!byFiliereMap[s.filiereId]) byFiliereMap[s.filiereId] = { filiereName: s.filiereId, studentCount: 0 };
    byFiliereMap[s.filiereId].studentCount++;
  }

  res.json({
    totalInscriptions: byStatus.total,
    pendingInscriptions: byStatus.pending,
    underReviewInscriptions: byStatus.underReview,
    approvedInscriptions: byStatus.approved,
    rejectedInscriptions: byStatus.rejected,
    enrollmentsByFiliere: Object.entries(byFiliereMap).map(([filiereId, data]) => ({ filiereId, ...data })),
    weeklyRegistrations: (() => {
      const now = new Date();
      return [1, 2, 3, 4].map((weekNum) => {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (4 - weekNum) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        const weeklyCount = inscriptions.filter((i) => {
          const d = new Date(i.createdAt);
          return d >= weekStart && d < weekEnd;
        }).length;
        return { week: `Semaine ${weekNum}`, count: weeklyCount };
      });
    })(),
  });
});

router.get("/analytics/financial", requireFinancial, async (req, res): Promise<void> => {
  const payments = await db.select().from(paymentsTable);
  const confirmed = payments.filter(p => p.status === "CONFIRMED");
  const pending = payments.filter(p => p.status === "INITIATED" || p.status === "PENDING");
  const totalRevenue = confirmed.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);
  const pendingAmount = pending.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);

  const byOperator: Record<string, { amount: number; count: number }> = {};
  for (const p of confirmed) {
    if (!byOperator[p.operator]) byOperator[p.operator] = { amount: 0, count: 0 };
    byOperator[p.operator].amount += Number(p.amount ?? 0);
    byOperator[p.operator].count++;
  }

  const byType: Record<string, { amount: number; count: number }> = {};
  for (const p of confirmed) {
    if (!byType[p.type]) byType[p.type] = { amount: 0, count: 0 };
    byType[p.type].amount += Number(p.amount ?? 0);
    byType[p.type].count++;
  }

  res.json({
    totalRevenue: totalRevenue.toFixed(2),
    pendingAmount: pendingAmount.toFixed(2),
    confirmedTransactions: confirmed.length,
    failedTransactions: payments.filter(p => p.status === "FAILED").length,
    revenueByOperator: Object.entries(byOperator).map(([operator, data]) => ({
      operator,
      amount: data.amount.toFixed(2),
      transactionCount: data.count,
    })),
    revenueByType: Object.entries(byType).map(([type, data]) => ({
      type,
      amount: data.amount.toFixed(2),
      count: data.count,
    })),
    revenueTimeline: [
      { date: "Jan", amount: "500000", count: 12 },
      { date: "Fév", amount: "750000", count: 18 },
      { date: "Mar", amount: "620000", count: 15 },
      { date: "Avr", amount: "890000", count: 22 },
      { date: "Mai", amount: "1100000", count: 28 },
      { date: "Jun", amount: "980000", count: 24 },
    ],
  });
});

router.get("/analytics/director", requireRole("DIRECTOR", "ADMIN"), async (_req, res): Promise<void> => {
  const [studentRow] = await db.select({ count: count() }).from(studentsTable);
  const [teacherRow] = await db.select({ count: count() }).from(teachersTable);
  const [courseRow] = await db.select({ count: count() }).from(coursesTable);
  const confirmedPayments = await db.select().from(paymentsTable).where(eq(paymentsTable.status, "CONFIRMED"));
  const totalRevenue = confirmedPayments.reduce((acc, p) => acc + Number(p.amount ?? 0), 0);

  const enrollments = await db.select().from(enrollmentsTable);
  const students = await db.select().from(studentsTable);

  const byFiliereMap: Record<string, { filiereName: string; studentCount: number }> = {};
  for (const s of students) {
    if (!s.filiereId) continue;
    if (!byFiliereMap[s.filiereId]) byFiliereMap[s.filiereId] = { filiereName: s.filiereId, studentCount: 0 };
    byFiliereMap[s.filiereId].studentCount++;
  }

  res.json({
    totalStudents: Number(studentRow?.count ?? 0),
    totalTeachers: Number(teacherRow?.count ?? 0),
    totalCourses: Number(courseRow?.count ?? 0),
    totalRevenue: totalRevenue.toFixed(2),
    monthlyEnrollmentGrowth: 12.5,
    platformEngagementRate: 68.3,
    enrollmentTrend: [
      { month: "Jan", count: 45 },
      { month: "Fév", count: 62 },
      { month: "Mar", count: 58 },
      { month: "Avr", count: 75 },
      { month: "Mai", count: 89 },
      { month: "Jun", count: 102 },
    ],
    revenueTrend: [
      { date: "Jan", amount: "500000", count: 12 },
      { date: "Fév", amount: "750000", count: 18 },
      { date: "Mar", amount: "620000", count: 15 },
      { date: "Avr", amount: "890000", count: 22 },
      { date: "Mai", amount: "1100000", count: 28 },
      { date: "Jun", amount: "980000", count: 24 },
    ],
    enrollmentsByFiliere: Object.entries(byFiliereMap).map(([filiereId, data]) => ({ filiereId, ...data })),
  });
});

export default router;
