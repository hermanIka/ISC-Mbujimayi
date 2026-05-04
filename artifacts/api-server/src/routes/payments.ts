import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, paymentsTable, paymentStatusEnum } from "@workspace/db";
import {
  ListPaymentsQueryParams,
  InitiatePaymentBody,
  GetPaymentByIdParams,
  PaymentCallbackBody,
  PaymentCallbackParams,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";
import { requireAuth, requireFinancial } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/payments", requireAuth, async (req, res): Promise<void> => {
  const params = ListPaymentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { page = 1, pageSize = 20, status } = params.data;
  const whereClause = status
    ? eq(paymentsTable.status, status as typeof paymentStatusEnum.enumValues[number])
    : undefined;
  const payments = await db
    .select()
    .from(paymentsTable)
    .where(whereClause)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const [totalRow] = await db.select({ count: count() }).from(paymentsTable);
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
  const reference = `ISC-${Date.now()}-${nanoid(6).toUpperCase()}`;
  const [payment] = await db
    .insert(paymentsTable)
    .values({
      id: nanoid(),
      reference,
      status: "INITIATED",
      currency: "CDF",
      ...parsed.data,
      amount: parsed.data.amount,
    })
    .returning();
  res.status(201).json({ ...payment, amount: payment.amount?.toString() ?? "0" });
});

router.post("/payments/callback/:operator", async (req, res): Promise<void> => {
  const callbackSecret = process.env.PAYMENT_CALLBACK_SECRET;
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
  res.json({ success: true, payment: payment ? { ...payment, amount: payment.amount?.toString() ?? "0" } : null });
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
  res.json({ ...payment, amount: payment.amount?.toString() ?? "0" });
});

export default router;
