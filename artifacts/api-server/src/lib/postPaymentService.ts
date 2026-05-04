import { db, paymentsTable, studentsTable, enrollmentsTable, coursesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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
}

async function logReceiptEmail(payment: ConfirmedPaymentPayload, studentName: string, studentEmail: string | null) {
  const emailContent = {
    to: studentEmail ?? "étudiant@isc-mbujimayi.ac.cd",
    subject: `[ISC Mbujimayi] Confirmation de paiement — Réf: ${payment.reference}`,
    body: `
Cher(e) ${studentName},

Nous vous confirmons la réception de votre paiement.

DÉTAILS DU PAIEMENT:
  Référence        : ${payment.reference}
  Montant          : ${Number(payment.amount).toLocaleString("fr-CD")} ${payment.currency}
  Type             : ${payment.type}
  Opérateur        : ${payment.operator}
  Référence op.    : ${payment.operatorRef ?? "N/A"}
  Statut           : CONFIRMÉ ✓

Votre reçu PDF est disponible sur la plateforme ISC Mbujimayi.

Cordialement,
Service Financier
Institut Supérieur de Commerce de Mbujimayi
    `.trim(),
  };

  logger.info({ emailContent, event: "payment_confirmed_email" }, "📧 [EMAIL] Reçu de paiement — à envoyer via SMTP");
}

async function handleCourseFeePaid(payment: ConfirmedPaymentPayload, studentId: string) {
  logger.info(
    { paymentId: payment.paymentId, studentId, type: payment.type },
    "💡 [ENROLLMENT] Paiement COURSE_FEE confirmé — étudiant éligible à l'inscription aux cours. " +
    "Vérifiez les inscriptions en attente pour cet étudiant.",
  );
}

export async function handlePaymentConfirmed(payload: ConfirmedPaymentPayload): Promise<void> {
  try {
    const [student] = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.id, payload.studentId));

    const studentName = student
      ? `${student.firstName} ${student.lastName}`
      : "Étudiant";

    const studentEmail = student ? null : null;

    await logReceiptEmail(payload, studentName, studentEmail);

    if (payload.type === "COURSE_FEE") {
      await handleCourseFeePaid(payload, payload.studentId);
    }

    if (payload.type === "INSCRIPTION_FEE") {
      logger.info(
        { paymentId: payload.paymentId, studentId: payload.studentId },
        "📋 [INSCRIPTION] Frais d'inscription confirmés — dossier d'inscription éligible pour traitement.",
      );
    }
  } catch (err) {
    logger.error({ err, paymentId: payload.paymentId }, "postPaymentService: error handling confirmed payment");
  }
}
