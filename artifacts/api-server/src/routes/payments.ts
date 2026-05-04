import { Router, type IRouter } from "express";
import { eq, count, and, gte, lte, inArray } from "drizzle-orm";
import { db, paymentsTable, paymentStatusEnum, studentsTable, filieresTable } from "@workspace/db";
import {
  ListPaymentsQueryParams,
  InitiatePaymentBody,
  GetPaymentByIdParams,
  PaymentCallbackBody,
  PaymentCallbackParams,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";
import { requireAuth, getCallerDbUser } from "../middlewares/auth";
import { simulateMobileMoneyPayment } from "../lib/mobileMoneyService";
import { generatePaymentReceiptPDF, generatePaymentReceiptPDFBuffer } from "../lib/pdfService";
import { handlePaymentConfirmed } from "../lib/postPaymentService";
import archiver from "archiver";

const router: IRouter = Router();

router.get("/payments", requireAuth, async (req, res): Promise<void> => {
  const params = ListPaymentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { page = 1, pageSize = 20, status } = params.data;
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const isStaff = ["ADMIN", "DIRECTOR", "FINANCIAL_SERVICE"].includes(callerUser.role);
  let studentId: string | undefined;
  if (!isStaff) {
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, callerUser.id));
    if (!student) {
      res.json({ payments: [], total: 0, page, pageSize, totalPages: 0 });
      return;
    }
    studentId = student.id;
  }
  const { and: andOp } = await import("drizzle-orm");
  const statusClause = status ? eq(paymentsTable.status, status as typeof paymentStatusEnum.enumValues[number]) : undefined;
  const studentClause = studentId ? eq(paymentsTable.studentId, studentId) : undefined;
  const whereClause = statusClause && studentClause ? andOp(statusClause, studentClause) : statusClause ?? studentClause;
  const payments = await db.select().from(paymentsTable).where(whereClause).limit(pageSize).offset((page - 1) * pageSize);
  const [totalRow] = await db.select({ count: count() }).from(paymentsTable).where(whereClause);
  const total = Number(totalRow?.count ?? 0);
  const formatted = payments.map(p => ({ ...p, amount: p.amount?.toString() ?? "0" }));
  res.json({ payments: formatted, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

router.post("/payments/initiate", requireAuth, async (req, res): Promise<void> => {
  const parsed = InitiatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const isStaff = ["ADMIN", "DIRECTOR", "FINANCIAL_SERVICE"].includes(callerUser.role);
  let resolvedStudentId = parsed.data.studentId;
  if (!isStaff) {
    const [callerStudent] = await db.select().from(studentsTable).where(eq(studentsTable.userId, callerUser.id));
    if (!callerStudent) {
      res.status(403).json({ error: "Student profile not found. Please complete your student registration first." });
      return;
    }
    resolvedStudentId = callerStudent.id;
  }
  const reference = `ISC-${Date.now()}-${nanoid(6).toUpperCase()}`;
  const rawCourseId: unknown = req.body.courseId;
  const courseIdFromBody: string | undefined =
    typeof rawCourseId === "string" && rawCourseId.trim().length > 0 ? rawCourseId.trim() : undefined;
  const metadata = courseIdFromBody ? JSON.stringify({ courseId: courseIdFromBody }) : null;
  const [payment] = await db
    .insert(paymentsTable)
    .values({
      id: nanoid(),
      reference,
      status: "INITIATED",
      currency: "CDF",
      ...parsed.data,
      studentId: resolvedStudentId,
      amount: parsed.data.amount,
      ...(metadata ? { metadata } : {}),
    })
    .returning();

  simulateMobileMoneyPayment(payment.id, payment.operator ?? "MTN_MONEY");

  res.status(201).json({ ...payment, amount: payment.amount?.toString() ?? "0" });
});

router.post("/payments/callback/:operator", async (req, res): Promise<void> => {
  const callbackSecret = process.env.PAYMENT_CALLBACK_SECRET;
  if (!callbackSecret && process.env.NODE_ENV === "production") {
    res.status(500).json({ error: "PAYMENT_CALLBACK_SECRET is not configured" });
    return;
  }
  if (callbackSecret) {
    const providedSecret = req.headers["x-callback-secret"] ?? req.headers["x-api-key"];
    if (providedSecret !== callbackSecret) {
      res.status(401).json({ error: "Invalid callback secret" });
      return;
    }
  }
  const params = PaymentCallbackParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = PaymentCallbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const OPERATOR_CANONICAL: Record<string, string> = {
    mtn: "MTN_MONEY",
    airtel: "AIRTEL_MONEY",
    orange: "ORANGE_MONEY",
  };
  const canonicalOperator = OPERATOR_CANONICAL[params.data.operator] ?? params.data.operator.toUpperCase();

  const status: typeof paymentStatusEnum.enumValues[number] = parsed.data.status === "SUCCESS" ? "CONFIRMED" : "FAILED";
  const [payment] = await db
    .update(paymentsTable)
    .set({ status, operatorRef: parsed.data.operatorRef })
    .where(eq(paymentsTable.reference, parsed.data.reference))
    .returning();

  if (status === "CONFIRMED" && payment) {
    await handlePaymentConfirmed({
      paymentId: payment.id,
      reference: payment.reference,
      amount: payment.amount?.toString() ?? "0",
      currency: payment.currency ?? "CDF",
      type: payment.type ?? "OTHER",
      operator: payment.operator ?? canonicalOperator,
      operatorRef: payment.operatorRef ?? null,
      phoneNumber: payment.phoneNumber ?? "",
      studentId: payment.studentId,
      metadata: payment.metadata ?? null,
    });
  }

  res.json({ success: true, payment: payment ? { ...payment, amount: payment.amount?.toString() ?? "0" } : null });
});

router.get("/payments/receipts/bulk", requireAuth, async (req, res): Promise<void> => {
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const isStaff = ["ADMIN", "DIRECTOR", "FINANCIAL_SERVICE"].includes(callerUser.role);
  if (!isStaff) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const VALID_PERIODS = ["day", "week", "month", "year"] as const;
  type ValidPeriod = typeof VALID_PERIODS[number];
  const rawPeriod = req.query.period as string | undefined;
  if (rawPeriod && !VALID_PERIODS.includes(rawPeriod as ValidPeriod)) {
    res.status(400).json({ error: `Invalid period. Must be one of: ${VALID_PERIODS.join(", ")}` });
    return;
  }
  const period: ValidPeriod = (rawPeriod as ValidPeriod) || "month";
  const now = new Date();
  let periodStart: Date;
  switch (period) {
    case "day":
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      periodStart = new Date(now.getFullYear(), now.getMonth(), diff);
      break;
    }
    case "year":
      periodStart = new Date(now.getFullYear(), 0, 1);
      break;
    case "month":
    default:
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const confirmedPayments = await db
    .select()
    .from(paymentsTable)
    .where(
      and(
        eq(paymentsTable.status, "CONFIRMED"),
        gte(paymentsTable.createdAt, periodStart),
        lte(paymentsTable.createdAt, periodEnd),
      ),
    );

  if (confirmedPayments.length === 0) {
    res.status(204).end();
    return;
  }

  const studentIds = [...new Set(confirmedPayments.map((p) => p.studentId).filter(Boolean))] as string[];
  const students = studentIds.length > 0
    ? await db.select().from(studentsTable).where(inArray(studentsTable.id, studentIds))
    : [];
  const studentMap = new Map(students.map((s) => [s.id, s]));

  const filiereIds = [...new Set(students.map((s) => s.filiereId).filter(Boolean))] as string[];
  const filieres = filiereIds.length > 0
    ? await db.select().from(filieresTable).where(inArray(filieresTable.id, filiereIds))
    : [];
  const filiereMap = new Map(filieres.map((f) => [f.id, f]));

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="recus-${period}-${now.toISOString().slice(0, 10)}.zip"`);

  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.on("error", (err) => {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.destroy(err);
    }
  });
  archive.pipe(res);

  try {
    for (const payment of confirmedPayments) {
      const student = payment.studentId ? studentMap.get(payment.studentId) : undefined;
      const filiereName = student?.filiereId ? (filiereMap.get(student.filiereId)?.name ?? null) : null;
      const pdfBuffer = await generatePaymentReceiptPDFBuffer({
        reference: payment.reference,
        amount: payment.amount?.toString() ?? "0",
        currency: payment.currency ?? "CDF",
        type: payment.type ?? "OTHER",
        operator: payment.operator ?? "MTN_MONEY",
        phoneNumber: payment.phoneNumber ?? null,
        operatorRef: payment.operatorRef ?? null,
        status: payment.status,
        createdAt: payment.createdAt ?? null,
        studentName: student ? `${student.firstName} ${student.lastName}` : "N/A",
        numEtudiant: student?.numEtudiant ?? "N/A",
        filiereName,
      });
      archive.append(pdfBuffer, { name: `recu-${payment.reference || payment.id}.pdf` });
    }
    await archive.finalize();
  } catch (err) {
    archive.abort();
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate ZIP archive" });
    } else {
      res.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  }
});

router.get("/payments/:id/receipt", requireAuth, async (req, res): Promise<void> => {
  const params = GetPaymentByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, params.data.id));
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const isStaff = ["ADMIN", "DIRECTOR", "FINANCIAL_SERVICE"].includes(callerUser.role);
  if (!isStaff) {
    const [callerStudent] = await db.select().from(studentsTable).where(eq(studentsTable.userId, callerUser.id));
    if (!callerStudent || payment.studentId !== callerStudent.id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
  }
  if (payment.status !== "CONFIRMED") {
    res.status(400).json({ error: "Receipt is only available for confirmed payments" });
    return;
  }
  const [student] = payment.studentId
    ? await db.select().from(studentsTable).where(eq(studentsTable.id, payment.studentId))
    : [undefined];
  let filiereName: string | null = null;
  if (student?.filiereId) {
    const [filiere] = await db.select().from(filieresTable).where(eq(filieresTable.id, student.filiereId));
    filiereName = filiere?.name ?? null;
  }
  generatePaymentReceiptPDF(
    {
      reference: payment.reference,
      amount: payment.amount?.toString() ?? "0",
      currency: payment.currency ?? "CDF",
      type: payment.type ?? "OTHER",
      operator: payment.operator ?? "MTN_MONEY",
      phoneNumber: payment.phoneNumber ?? null,
      operatorRef: payment.operatorRef ?? null,
      status: payment.status,
      createdAt: payment.createdAt ?? null,
      studentName: student ? `${student.firstName} ${student.lastName}` : "N/A",
      numEtudiant: student?.numEtudiant ?? "N/A",
      filiereName,
    },
    res,
  );
});

router.get("/payments/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetPaymentByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, params.data.id));
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }
  const callerUser = await getCallerDbUser(req);
  if (!callerUser) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const isStaff = ["ADMIN", "DIRECTOR", "FINANCIAL_SERVICE"].includes(callerUser.role);
  if (!isStaff) {
    const [callerStudent] = await db.select().from(studentsTable).where(eq(studentsTable.userId, callerUser.id));
    if (!callerStudent || payment.studentId !== callerStudent.id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
  }
  res.json({ ...payment, amount: payment.amount?.toString() ?? "0" });
});

export default router;
