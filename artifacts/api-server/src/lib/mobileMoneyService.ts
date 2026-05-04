import { db, paymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const SUCCESS_RATE = 0.9;
const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 8000;

const OPERATOR_PREFIXES: Record<string, string> = {
  MTN_MONEY: "MTN",
  AIRTEL_MONEY: "AIR",
  ORANGE_MONEY: "ORA",
};

function randomDelay(): number {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

function generateOperatorRef(operator: string): string {
  const prefix = OPERATOR_PREFIXES[operator] ?? "PAY";
  const suffix = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${suffix}`;
}

export function simulateMobileMoneyPayment(paymentId: string, operator: string): void {
  const delay = randomDelay();
  const willSucceed = Math.random() < SUCCESS_RATE;

  setTimeout(async () => {
    try {
      const status = willSucceed ? "CONFIRMED" : "FAILED";
      const operatorRef = willSucceed ? generateOperatorRef(operator) : null;

      await db
        .update(paymentsTable)
        .set({ status, ...(operatorRef ? { operatorRef } : {}) })
        .where(eq(paymentsTable.id, paymentId));

      logger.info(
        { paymentId, operator, status, delay: Math.round(delay) },
        "Mobile Money simulation completed",
      );
    } catch (err) {
      logger.error({ paymentId, err }, "Mobile Money simulation failed to update DB");
    }
  }, delay);

  logger.info(
    { paymentId, operator, delay: Math.round(delay), willSucceed },
    "Mobile Money simulation started",
  );
}
