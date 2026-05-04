import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
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
import { generatePaymentReceiptPDF } from "../lib/pdfService";
import { handlePaymentConfirmed } from "../lib/postPaymentService";

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
      operator: payment.operator ?? params.data.operator,
      operatorRef: payment.operatorRef ?? null,
      phoneNumber: payment.phoneNumber ?? "",
      studentId: payment.studentId,
    });
  }

  res.json({ success: true, payment: payment ? { ...payment, amount: payment.amount?.toString() ?? "0" } : null });
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
