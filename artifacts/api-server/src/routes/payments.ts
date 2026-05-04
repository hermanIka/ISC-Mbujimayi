import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, paymentsTable } from "@workspace/db";
import {
  ListPaymentsQueryParams,
  InitiatePaymentBody,
  GetPaymentByIdParams,
  PaymentCallbackBody,
  PaymentCallbackParams,
} from "@workspace/api-zod";
import { nanoid } from "nanoid";

const router: IRouter = Router();

router.get("/payments", async (req, res): Promise<void> => {
  const params = ListPaymentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { page = 1, pageSize = 20, status } = params.data;
  let query = db.select().from(paymentsTable);
  if (status) query = query.where(eq(paymentsTable.status, status as any)) as any;
  const payments = await query.limit(pageSize).offset((page - 1) * pageSize);
  const [totalRow] = await db.select({ count: count() }).from(paymentsTable);
  const total = Number(totalRow?.count ?? 0);
  const formatted = payments.map(p => ({ ...p, amount: p.amount?.toString() ?? "0" }));
  res.json({ payments: formatted, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

router.post("/payments/initiate", async (req, res): Promise<void> => {
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
      amount: parsed.data.amount as any,
    })
    .returning();
  res.status(201).json({ ...payment, amount: payment.amount?.toString() ?? "0" });
});

router.post("/payments/callback/:operator", async (req, res): Promise<void> => {
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
  const status = parsed.data.status === "SUCCESS" ? "CONFIRMED" : "FAILED";
  const [payment] = await db
    .update(paymentsTable)
    .set({ status: status as any, operatorRef: parsed.data.operatorRef })
    .where(eq(paymentsTable.reference, parsed.data.reference))
    .returning();
  res.json({ success: true, payment: payment ? { ...payment, amount: payment.amount?.toString() ?? "0" } : null });
});

router.get("/payments/:id", async (req, res): Promise<void> => {
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
