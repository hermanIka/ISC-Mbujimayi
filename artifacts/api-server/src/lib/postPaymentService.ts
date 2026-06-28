import { db, paymentsTable, studentsTable, usersTable, enrollmentsTable, coursesTable, filieresTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "./logger";
import { sendEmail, buildPaymentConfirmedEmail, buildInscriptionReceivedEmail } from "./emailService";
import { generatePaymentReceiptPDFBuffer } from "./pdfService";
import type { PaymentReceiptData } from "./pdfService";

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
  confirmedAt?: Date | null;
}

const OPERATOR_LABELS: Record<string, string> = {
  VODACOM_MONEY: "Vodacom Money",
  AIRTEL_MONEY: "Airtel Money",
  ORANGE_MONEY: "Orange Money",
};

const TYPE_LABELS: Record<string, string> = {
  INSCRIPTION_FEE: "Frais d'inscription",
  COURSE_FEE: "Frais de cours",
  EXAM_FEE: "Frais d'examen",
  OTHER: "Autre",
};

interface StudentInfo {
  name: string;
  email: string;
  numEtudiant: string;
  filiereName?: string | null;
}

async function resolveStudentInfo(studentId: string): Promise<StudentInfo | null> {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  if (!student) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, student.userId));
  const email = user?.email ?? null;
  const name = `${student.firstName} ${student.lastName}`.trim();

  let filiereName: string | null = null;
  if (student.filiereId) {
    const [filiere] = await db.select().from(filieresTable).where(eq(filieresTable.id, student.filiereId));
    filiereName = filiere?.name ?? null;
  }

  return {
    name,
    email: email ?? `${name.toLowerCase().replace(/ /g, ".")}@isc-mbujimayi.ac.cd`,
    numEtudiant: student.numEtudiant ?? studentId,
    filiereName,
  };
}

async function sendPaymentConfirmationEmail(
  payload: ConfirmedPaymentPayload,
  studentInfo: StudentInfo,
): Promise<void> {
  const { subject, html } = buildPaymentConfirmedEmail({
    studentName: studentInfo.name,
    reference: payload.reference,
    amount: payload.amount,
    currency: payload.currency,
    type: payload.type,
    operator: payload.operator,
    operatorRef: payload.operatorRef,
    phoneNumber: payload.phoneNumber,
  });

  const receiptData: PaymentReceiptData = {
    reference: payload.reference,
    amount: payload.amount,
    currency: payload.currency,
    type: payload.type,
    operator: payload.operator,
    phoneNumber: payload.phoneNumber,
    operatorRef: payload.operatorRef,
    status: "CONFIRMED",
    createdAt: payload.confirmedAt ?? new Date(),
    studentName: studentInfo.name,
    numEtudiant: studentInfo.numEtudiant,
    filiereName: studentInfo.filiereName,
  };

  let pdfBuffer: Buffer | undefined;
  try {
    pdfBuffer = await generatePaymentReceiptPDFBuffer(receiptData);
  } catch (err) {
    logger.warn({ err, paymentId: payload.paymentId }, "📧 [EMAIL] Failed to generate receipt PDF for attachment");
  }

  await sendEmail({
    to: studentInfo.email,
    subject,
    html,
    attachments: pdfBuffer
      ? [{ filename: `recu-${payload.reference}.pdf`, content: pdfBuffer }]
      : undefined,
  });
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
    const studentInfo = await resolveStudentInfo(payload.studentId);
    const studentName = studentInfo?.name ?? "Étudiant";
    const studentEmail = studentInfo?.email ?? `student.${payload.studentId}@isc-mbujimayi.ac.cd`;

    if (studentInfo) {
      await sendPaymentConfirmationEmail(payload, studentInfo);
    } else {
      logger.warn({ studentId: payload.studentId }, "📧 [EMAIL] Student not found — skipping payment confirmation email");
    }

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

    if (payload.type === "INSCRIPTION_FEE" && studentInfo) {
      logger.info(
        { paymentId: payload.paymentId, studentId: payload.studentId },
        "📋 [INSCRIPTION] Frais d'inscription confirmés — envoi email dossier reçu",
      );
      try {
        const { subject, html } = buildInscriptionReceivedEmail({
          studentName: studentInfo.name,
          filiereName: studentInfo.filiereName,
          reference: payload.reference,
          operatorRef: payload.operatorRef ?? "N/A",
          amount: payload.amount,
          currency: payload.currency,
          operator: payload.operator,
        });
        await sendEmail({ to: studentInfo.email, subject, html });
      } catch (err) {
        logger.error({ err, paymentId: payload.paymentId }, "📧 [EMAIL] Failed to send inscription received email");
      }
    }
  } catch (err) {
    logger.error({ err, paymentId: payload.paymentId }, "postPaymentService: unhandled error");
  }
}
