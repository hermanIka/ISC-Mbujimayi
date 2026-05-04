import { db, paymentsTable, studentsTable, usersTable, enrollmentsTable, coursesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "./logger";

export interface ConfirmedPaymentPayload {
  paymentId: string;
  reference: string;
  amount: string;
  currency: string;
  type: string;
  operator: string;
  operatorRef: string | null;
  phoneNumber: string;
  studentId: string;
  metadata?: string | null;
}

const OPERATOR_LABELS: Record<string, string> = {
  MTN_MONEY: "MTN Mobile Money",
  AIRTEL_MONEY: "Airtel Money",
  ORANGE_MONEY: "Orange Money",
};

const TYPE_LABELS: Record<string, string> = {
  INSCRIPTION_FEE: "Frais d'inscription",
  COURSE_FEE: "Frais de cours",
  EXAM_FEE: "Frais d'examen",
  OTHER: "Autre",
};

async function resolveStudentEmail(studentId: string): Promise<{ name: string; email: string } | null> {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  if (!student) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, student.userId));
  const email = user?.email ?? null;
  const name = `${student.firstName} ${student.lastName}`.trim();
  return { name, email: email ?? `${name.toLowerCase().replace(/ /g, ".")}@isc-mbujimayi.ac.cd` };
}

async function logReceiptEmail(payment: ConfirmedPaymentPayload, studentName: string, studentEmail: string) {
  const amountFormatted = Number(payment.amount).toLocaleString("fr-CD");
  const emailContent = {
    to: studentEmail,
    subject: `[ISC Mbujimayi] Confirmation de paiement — Réf: ${payment.reference}`,
    body: [
      `Cher(e) ${studentName},`,
      "",
      "Nous avons bien reçu votre paiement. Voici le récapitulatif :",
      "",
      `  Référence         : ${payment.reference}`,
      `  Montant           : ${amountFormatted} ${payment.currency}`,
      `  Type              : ${TYPE_LABELS[payment.type] ?? payment.type}`,
      `  Opérateur         : ${OPERATOR_LABELS[payment.operator] ?? payment.operator}`,
      `  Référence op.     : ${payment.operatorRef ?? "N/A"}`,
      `  Numéro            : ${payment.phoneNumber}`,
      `  Statut            : ✓ CONFIRMÉ`,
      "",
      "Votre reçu PDF est disponible sur la plateforme : https://www.isc-mbujimayi.ac.cd/dashboard",
      "",
      "Cordialement,",
      "Service Financier — Institut Supérieur de Commerce de Mbujimayi",
    ].join("\n"),
  };
  logger.info({ emailContent, event: "payment_confirmed_email" }, "📧 [EMAIL] Reçu de paiement à envoyer");
}

async function unlockCourseEnrollment(studentId: string, courseId: string): Promise<void> {
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) {
    logger.warn({ studentId, courseId }, "enrollment unlock: course not found");
    return;
  }

  const [existing] = await db
    .select()
    .from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.studentId, studentId), eq(enrollmentsTable.courseId, courseId)));

  if (existing) {
    logger.info({ studentId, courseId, enrollmentId: existing.id }, "enrollment unlock: enrollment already exists");
    return;
  }

  const [enrollment] = await db
    .insert(enrollmentsTable)
    .values({ id: nanoid(), studentId, courseId })
    .returning();

  logger.info(
    { studentId, courseId, enrollmentId: enrollment.id, courseTitle: course.title },
    "✅ [ENROLLMENT] Inscription automatique créée suite au paiement COURSE_FEE confirmé",
  );
}

export async function handlePaymentConfirmed(payload: ConfirmedPaymentPayload): Promise<void> {
  try {
    const recipient = await resolveStudentEmail(payload.studentId);
    const studentName = recipient?.name ?? "Étudiant";
    const studentEmail = recipient?.email ?? `student.${payload.studentId}@isc-mbujimayi.ac.cd`;

    await logReceiptEmail(payload, studentName, studentEmail);

    if (payload.type === "COURSE_FEE" && payload.metadata) {
      try {
        const meta = JSON.parse(payload.metadata) as Record<string, unknown>;
        const courseId = typeof meta.courseId === "string" ? meta.courseId : null;
        if (courseId) {
          await unlockCourseEnrollment(payload.studentId, courseId);
        } else {
          logger.info(
            { studentId: payload.studentId },
            "💡 [ENROLLMENT] COURSE_FEE confirmé sans courseId en metadata — inscription manuelle requise",
          );
        }
      } catch {
        logger.warn({ paymentId: payload.paymentId }, "Failed to parse payment metadata for enrollment unlock");
      }
    }

    if (payload.type === "INSCRIPTION_FEE") {
      logger.info(
        { paymentId: payload.paymentId, studentId: payload.studentId },
        "📋 [INSCRIPTION] Frais d'inscription confirmés — dossier éligible pour traitement par le service académique",
      );
    }
  } catch (err) {
    logger.error({ err, paymentId: payload.paymentId }, "postPaymentService: unhandled error");
  }
}
