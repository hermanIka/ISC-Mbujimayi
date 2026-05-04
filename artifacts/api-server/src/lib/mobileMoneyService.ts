import { db, paymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import { handlePaymentConfirmed } from "./postPaymentService";

const SUCCESS_RATE = 0.9;

interface OperatorConfig {
  prefix: string;
  minDelayMs: number;
  maxDelayMs: number;
  name: string;
}

const OPERATOR_CONFIGS: Record<string, OperatorConfig> = {
  MTN_MONEY: {
    prefix: "MTN",
    minDelayMs: 2000,
    maxDelayMs: 4000,
    name: "MTN Mobile Money",
  },
  AIRTEL_MONEY: {
    prefix: "AIR",
    minDelayMs: 2000,
    maxDelayMs: 3500,
    name: "Airtel Money",
  },
  ORANGE_MONEY: {
    prefix: "ORA",
    minDelayMs: 2500,
    maxDelayMs: 4000,
    name: "Orange Money",
  },
};

const DEFAULT_OPERATOR_CONFIG: OperatorConfig = {
  prefix: "PAY",
  minDelayMs: 2000,
  maxDelayMs: 4000,
  name: "Mobile Money",
};

function getOperatorConfig(operator: string): OperatorConfig {
  return OPERATOR_CONFIGS[operator] ?? DEFAULT_OPERATOR_CONFIG;
}

function randomDelayMs(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function generateOperatorRef(config: OperatorConfig): string {
  const suffix = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${config.prefix}-${suffix}`;
}

export function simulateMobileMoneyPayment(paymentId: string, operator: string): void {
  const config = getOperatorConfig(operator);
  const delay = randomDelayMs(config.minDelayMs, config.maxDelayMs);
  const willSucceed = Math.random() < SUCCESS_RATE;

  logger.info(
    {
      paymentId,
      operator,
      operatorName: config.name,
      delayMs: Math.round(delay),
      willSucceed,
    },
    `${config.name} simulation started`,
  );

  setTimeout(async () => {
    try {
      const status = willSucceed ? "CONFIRMED" : "FAILED";
      const operatorRef = willSucceed ? generateOperatorRef(config) : null;

      const [updated] = await db
        .update(paymentsTable)
        .set({ status, ...(operatorRef ? { operatorRef } : {}) })
        .where(eq(paymentsTable.id, paymentId))
        .returning();

      logger.info(
        { paymentId, operator, status, operatorRef, delayMs: Math.round(delay) },
        `${config.name} simulation completed`,
      );

      if (status === "CONFIRMED" && updated) {
        await handlePaymentConfirmed({
          paymentId: updated.id,
          reference: updated.reference,
          amount: updated.amount?.toString() ?? "0",
          currency: updated.currency ?? "CDF",
          type: updated.type ?? "OTHER",
          operator: updated.operator ?? operator,
          operatorRef: updated.operatorRef ?? null,
          phoneNumber: updated.phoneNumber ?? "",
          studentId: updated.studentId,
          metadata: updated.metadata ?? null,
        });
      }
    } catch (err) {
      logger.error({ paymentId, err }, `${config.name} simulation failed`);
    }
  }, delay);
}
