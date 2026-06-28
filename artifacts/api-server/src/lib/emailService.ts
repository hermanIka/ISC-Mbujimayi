import { Resend } from "resend";
import { logger } from "./logger";

const ISC_NAME = "Institut Supérieur de Commerce de Mbujimayi";
const _rawFrom = process.env.RESEND_FROM_ADDRESS;
// Validate that the value actually looks like an email/sender (must contain '@')
const RESEND_FROM_ADDRESS = _rawFrom && _rawFrom.includes("@") ? _rawFrom : null;
if (!RESEND_FROM_ADDRESS) {
  if (_rawFrom && !_rawFrom.includes("@")) {
    logger.warn(
      "⚠️ [EMAIL] RESEND_FROM_ADDRESS does not appear to be a valid email address — falling back to sandbox sender. " +
      "Set it to e.g. 'ISC Mbujimayi <noreply@isc-mbujimayi.ac.cd>'.",
    );
  } else {
    logger.warn(
      "⚠️ [EMAIL] RESEND_FROM_ADDRESS is not set — emails will use Resend's sandbox sender (onboarding@resend.dev). " +
      "Set RESEND_FROM_ADDRESS to a verified domain address (e.g. 'ISC Mbujimayi <noreply@isc-mbujimayi.ac.cd>') " +
      "to ensure emails reach recipients' inboxes instead of being flagged as spam.",
    );
  }
}
const ISC_FROM = RESEND_FROM_ADDRESS ?? "ISC Mbujimayi <onboarding@resend.dev>";
const PRIMARY_COLOR = "#1a3a6b";
const ACCENT_COLOR = "#f59e0b";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("⚠️ [EMAIL] RESEND_API_KEY is not set — emails will not be sent.");
    return null;
  }
  return new Resend(apiKey);
}

function htmlWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ISC Mbujimayi</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:${PRIMARY_COLOR};padding:28px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">${ISC_NAME}</p>
              <p style="margin:6px 0 0;color:#cbd5e1;font-size:12px;">Avenue Kanshi, Quartier Bipemba, Mbujimayi, RD Congo</p>
              <div style="margin-top:14px;height:2px;background:${ACCENT_COLOR};border-radius:2px;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
                © ${new Date().getFullYear()} ${ISC_NAME} — Ce message est envoyé automatiquement, merci de ne pas y répondre directement.<br/>
                <a href="mailto:info@isc-mbujimayi.ac.cd" style="color:${PRIMARY_COLOR};text-decoration:none;">info@isc-mbujimayi.ac.cd</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function greeting(name: string): string {
  return `<p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Cher(e) <strong>${name}</strong>,</p>`;
}

function actionButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:${PRIMARY_COLOR};color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:6px;font-size:15px;font-weight:bold;letter-spacing:0.3px;">${text}</a>
  </div>`;
}

function infoTable(rows: [string, string][]): string {
  const rowsHtml = rows
    .map(
      ([label, value], i) =>
        `<tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"};">
          <td style="padding:10px 14px;color:#475569;font-size:13px;font-weight:bold;white-space:nowrap;">${label}</td>
          <td style="padding:10px 14px;color:#1e293b;font-size:13px;">${value}</td>
        </tr>`,
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin:20px 0;">
    ${rowsHtml}
  </table>`;
}

function alertBox(text: string, type: "success" | "danger" | "info"): string {
  const configs = {
    success: { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d" },
    danger: { bg: "#fef2f2", border: "#fecaca", color: "#dc2626" },
    info: { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" },
  };
  const c = configs[type];
  return `<div style="background:${c.bg};border:1px solid ${c.border};border-radius:6px;padding:14px 18px;margin:20px 0;">
    <p style="margin:0;color:${c.color};font-size:13px;">${text}</p>
  </div>`;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const client = getResendClient();

  if (!client) {
    logger.warn(
      { to: options.to, subject: options.subject },
      "📧 [EMAIL] RESEND_API_KEY not set — email not sent (logged only)",
    );
    return;
  }

  // In dev/test mode, Resend only allows sending to the account owner's email.
  // Set RESEND_TEST_TO to your Resend account email to receive all test emails.
  const testOverride = process.env.RESEND_TEST_TO;
  const effectiveTo = testOverride ?? options.to;
  if (testOverride) {
    logger.info(
      { originalTo: options.to, overrideTo: testOverride },
      "📧 [EMAIL] Dev mode — redirecting email to RESEND_TEST_TO",
    );
  }

  try {
    const payload: Parameters<typeof client.emails.send>[0] = {
      from: ISC_FROM,
      to: effectiveTo,
      subject: options.subject,
      html: options.html,
    };

    if (options.attachments && options.attachments.length > 0) {
      payload.attachments = options.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      }));
    }

    const result = await client.emails.send(payload);

    if (result.error) {
      logger.error({ error: result.error, to: options.to }, "📧 [EMAIL] Resend API error");
    } else {
      logger.info({ id: result.data?.id, to: options.to, subject: options.subject }, "📧 [EMAIL] Email sent successfully");
    }
  } catch (err) {
    logger.error({ err, to: options.to }, "📧 [EMAIL] Failed to send email via Resend");
  }
}

export function buildInscriptionStatusEmail(params: {
  studentName: string;
  status: "APPROVED" | "REJECTED";
  notes?: string | null;
  filiereName?: string | null;
}): { subject: string; html: string } {
  const { studentName, status, notes, filiereName } = params;

  const isApproved = status === "APPROVED";

  const subject = isApproved
    ? `[ISC Mbujimayi] ✅ Votre dossier d'inscription a été approuvé`
    : `[ISC Mbujimayi] ❌ Votre dossier d'inscription a été rejeté`;

  const statusBadge = isApproved
    ? `<span style="display:inline-block;background:#dcfce7;color:#15803d;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:bold;">✅ APPROUVÉ</span>`
    : `<span style="display:inline-block;background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:bold;">❌ REJETÉ</span>`;

  const infoRows: [string, string][] = [];
  if (filiereName) infoRows.push(["Filière:", filiereName]);

  const bodyContent = `
    ${greeting(studentName)}
    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
      Nous avons examiné votre dossier d'inscription à l'${ISC_NAME}. Voici le résultat :
    </p>
    <div style="text-align:center;margin:20px 0;">
      ${statusBadge}
    </div>
    ${infoRows.length > 0 ? infoTable(infoRows) : ""}
    ${
      isApproved
        ? `${alertBox(
            "Félicitations ! Votre dossier d'inscription a été approuvé par le service académique. Vous pouvez désormais accéder à la plateforme et commencer votre parcours académique.",
            "success",
          )}
          ${actionButton("Accéder à la plateforme", "https://www.isc-mbujimayi.ac.cd/dashboard")}`
        : `${alertBox(
            "Votre dossier d'inscription n'a pas pu être approuvé en l'état. Veuillez prendre contact avec le service académique pour obtenir plus d'informations et soumettre un nouveau dossier si nécessaire.",
            "danger",
          )}`
    }
    ${notes ? `<div style="margin:20px 0;"><p style="margin:0 0 8px;color:#475569;font-size:13px;font-weight:bold;">Commentaire du service académique :</p><div style="background:#f8fafc;border-left:4px solid ${PRIMARY_COLOR};padding:12px 16px;border-radius:0 6px 6px 0;"><p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">${notes}</p></div></div>` : ""}
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
      Pour toute question, contactez le service académique à <a href="mailto:academique@isc-mbujimayi.ac.cd" style="color:${PRIMARY_COLOR};">academique@isc-mbujimayi.ac.cd</a>.<br/>
      Cordialement,<br/><strong>Service Académique — ISC Mbujimayi</strong>
    </p>
  `;

  return { subject, html: htmlWrapper(bodyContent) };
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

export function buildPaymentConfirmedEmail(params: {
  studentName: string;
  reference: string;
  amount: string;
  currency: string;
  type: string;
  operator: string;
  operatorRef: string | null;
  phoneNumber: string;
}): { subject: string; html: string } {
  const { studentName, reference, amount, currency, type, operator, operatorRef, phoneNumber } = params;

  const subject = `[ISC Mbujimayi] ✅ Confirmation de paiement — Réf: ${reference}`;
  const amountFormatted = Number(amount).toLocaleString("fr-CD");

  const rows: [string, string][] = [
    ["Référence:", reference],
    ["Montant:", `${amountFormatted} ${currency}`],
    ["Type de paiement:", TYPE_LABELS[type] ?? type],
    ["Opérateur:", OPERATOR_LABELS[operator] ?? operator],
    ["Numéro:", phoneNumber],
    ["Réf. opérateur:", operatorRef ?? "N/A"],
    ["Statut:", "✅ Confirmé"],
  ];

  const bodyContent = `
    ${greeting(studentName)}
    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
      Nous avons bien reçu et confirmé votre paiement. Voici le récapitulatif :
    </p>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:18px;text-align:center;margin:0 0 20px;">
      <p style="margin:0 0 4px;color:#0369a1;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Montant payé</p>
      <p style="margin:0;color:${PRIMARY_COLOR};font-size:28px;font-weight:bold;">${amountFormatted} ${currency}</p>
    </div>
    ${infoTable(rows)}
    ${alertBox("Votre reçu officiel de paiement est joint à cet email en pièce jointe. Conservez-le comme preuve de votre paiement.", "success")}
    ${actionButton("Accéder à mon espace", "https://www.isc-mbujimayi.ac.cd/dashboard")}
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
      Pour toute question, contactez le service financier à <a href="mailto:finances@isc-mbujimayi.ac.cd" style="color:${PRIMARY_COLOR};">finances@isc-mbujimayi.ac.cd</a>.<br/>
      Cordialement,<br/><strong>Service Financier — ISC Mbujimayi</strong>
    </p>
  `;

  return { subject, html: htmlWrapper(bodyContent) };
}

export function buildInscriptionSubmittedEmail(params: {
  studentName: string;
  filiereName?: string | null;
}): { subject: string; html: string } {
  const { studentName, filiereName } = params;
  const subject = `[ISC Mbujimayi] 📋 Votre dossier d'inscription a bien été soumis`;

  const rows: [string, string][] = [
    ["Statut:", "📋 Soumis — en attente de traitement"],
    ...(filiereName ? [["Filière:", filiereName] as [string, string]] : []),
  ];

  const bodyContent = `
    ${greeting(studentName)}
    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
      Nous avons bien reçu votre dossier de candidature à l'<strong>${ISC_NAME}</strong>.
      Notre équipe va examiner votre demande et vous informera de la suite donnée.
    </p>
    ${alertBox("Votre dossier est en cours d'examen par le service académique. Vous serez notifié(e) par email dès qu'une décision sera prise.", "info")}
    ${infoTable(rows)}
    ${actionButton("Suivre ma candidature", "https://www.isc-mbujimayi.ac.cd/inscriptions")}
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
      Pour toute question, contactez le service académique à <a href="mailto:academique@isc-mbujimayi.ac.cd" style="color:${PRIMARY_COLOR};">academique@isc-mbujimayi.ac.cd</a>.<br/>
      Cordialement,<br/><strong>Service des Inscriptions — ISC Mbujimayi</strong>
    </p>
  `;

  return { subject, html: htmlWrapper(bodyContent) };
}

export function buildInscriptionReceivedEmail(params: {
  studentName: string;
  filiereName?: string | null;
  reference: string;
  operatorRef: string;
  amount: string;
  currency: string;
  operator: string;
}): { subject: string; html: string } {
  const { studentName, filiereName, reference, operatorRef, amount, currency, operator } = params;
  const subject = `[ISC Mbujimayi] 📋 Votre dossier d'inscription a bien été reçu`;
  const amountFormatted = Number(amount).toLocaleString("fr-CD");

  const rows: [string, string][] = [
    ["Référence:", reference],
    ["Montant payé:", `${amountFormatted} ${currency}`],
    ["Opérateur:", OPERATOR_LABELS[operator] ?? operator],
    ["Réf. opérateur:", operatorRef],
    ...(filiereName ? [["Filière:", filiereName] as [string, string]] : []),
    ["Statut dossier:", "📋 En cours d'examen"],
  ];

  const bodyContent = `
    ${greeting(studentName)}
    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
      Nous avons bien reçu votre dossier de candidature à l'<strong>${ISC_NAME}</strong>.
      Votre paiement des frais d'inscription a été confirmé et votre dossier a été transmis au service académique pour examen.
    </p>
    ${alertBox("Votre candidature est en cours d'examen par le service académique. Vous serez notifié(e) par email dès qu'une décision sera prise.", "info")}
    ${infoTable(rows)}
    <p style="margin:20px 0;color:#374151;font-size:14px;line-height:1.6;">
      Le service académique traitera votre dossier dans les meilleurs délais. En attendant, vous pouvez vous connecter à la plateforme pour suivre l'état de votre candidature.
    </p>
    ${actionButton("Suivre ma candidature", "https://www.isc-mbujimayi.ac.cd/inscriptions")}
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
      Pour toute question, contactez le service académique à <a href="mailto:academique@isc-mbujimayi.ac.cd" style="color:${PRIMARY_COLOR};">academique@isc-mbujimayi.ac.cd</a>.<br/>
      Cordialement,<br/><strong>Service des Inscriptions — ISC Mbujimayi</strong>
    </p>
  `;

  return { subject, html: htmlWrapper(bodyContent) };
}

export function buildTeacherRegReceivedEmail(params: {
  name: string;
  matricule: string;
  emailUniversitaire: string;
}): { subject: string; html: string } {
  const { name, matricule, emailUniversitaire } = params;
  const subject = `[ISC Mbujimayi] 📋 Votre demande d'inscription enseignant a bien été reçue`;

  const rows: [string, string][] = [
    ["Nom complet:", name],
    ["Matricule:", matricule],
    ["Email universitaire:", emailUniversitaire],
    ["Statut:", "📋 En attente de validation"],
  ];

  const bodyContent = `
    ${greeting(name)}
    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
      Nous avons bien reçu votre demande d'inscription en tant qu'<strong>enseignant</strong> à l'<strong>${ISC_NAME}</strong>.
      Votre dossier est en cours d'examen par la direction. Vous serez notifié(e) par email dès qu'une décision sera prise.
    </p>
    ${alertBox("Votre dossier est en cours d'examen par l'administration. La validation peut prendre quelques jours ouvrables.", "info")}
    ${infoTable(rows)}
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
      Pour toute question, contactez l'administration à <a href="mailto:admin@isc-mbujimayi.ac.cd" style="color:${PRIMARY_COLOR};">admin@isc-mbujimayi.ac.cd</a>.<br/>
      Cordialement,<br/><strong>Direction — ISC Mbujimayi</strong>
    </p>
  `;

  return { subject, html: htmlWrapper(bodyContent) };
}

export function buildTeacherRegStatusEmail(params: {
  name: string;
  status: "APPROVED" | "REJECTED";
  notes?: string | null;
}): { subject: string; html: string } {
  const { name, status, notes } = params;
  const isApproved = status === "APPROVED";

  const subject = isApproved
    ? `[ISC Mbujimayi] ✅ Votre inscription enseignant a été approuvée`
    : `[ISC Mbujimayi] ❌ Votre inscription enseignant a été rejetée`;

  const statusBadge = isApproved
    ? `<span style="display:inline-block;background:#dcfce7;color:#15803d;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:bold;">✅ APPROUVÉE</span>`
    : `<span style="display:inline-block;background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:bold;">❌ REJETÉE</span>`;

  const bodyContent = `
    ${greeting(name)}
    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
      Voici la décision concernant votre demande d'inscription en tant qu'enseignant à l'${ISC_NAME} :
    </p>
    <div style="text-align:center;margin:20px 0;">${statusBadge}</div>
    ${isApproved
      ? `${alertBox("Félicitations ! Votre dossier a été approuvé. Vous serez contacté(e) prochainement pour finaliser votre intégration.", "success")}
         ${actionButton("Accéder à la plateforme", "https://www.isc-mbujimayi.ac.cd/dashboard")}`
      : `${alertBox("Votre dossier n'a pas pu être approuvé en l'état. Veuillez contacter l'administration pour plus d'informations.", "danger")}`
    }
    ${notes ? `<div style="margin:20px 0;"><p style="margin:0 0 8px;color:#475569;font-size:13px;font-weight:bold;">Commentaire :</p><div style="background:#f8fafc;border-left:4px solid ${PRIMARY_COLOR};padding:12px 16px;border-radius:0 6px 6px 0;"><p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">${notes}</p></div></div>` : ""}
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
      Cordialement,<br/><strong>Direction — ISC Mbujimayi</strong>
    </p>
  `;

  return { subject, html: htmlWrapper(bodyContent) };
}

export function buildStaffRegReceivedEmail(params: {
  name: string;
  matricule: string;
  emailUniversitaire: string;
  roleStaff: string;
}): { subject: string; html: string } {
  const { name, matricule, emailUniversitaire, roleStaff } = params;
  const subject = `[ISC Mbujimayi] 📋 Votre demande d'inscription personnel a bien été reçue`;

  const rows: [string, string][] = [
    ["Nom complet:", name],
    ["Matricule:", matricule],
    ["Email universitaire:", emailUniversitaire],
    ["Fonction:", roleStaff],
    ["Statut:", "📋 En attente de validation"],
  ];

  const bodyContent = `
    ${greeting(name)}
    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
      Nous avons bien reçu votre demande d'inscription en tant que <strong>personnel administratif</strong> à l'<strong>${ISC_NAME}</strong>.
      Votre dossier est en cours d'examen par la direction.
    </p>
    ${alertBox("Votre dossier est en cours d'examen par la direction. La validation peut prendre quelques jours ouvrables.", "info")}
    ${infoTable(rows)}
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
      Pour toute question, contactez la direction à <a href="mailto:direction@isc-mbujimayi.ac.cd" style="color:${PRIMARY_COLOR};">direction@isc-mbujimayi.ac.cd</a>.<br/>
      Cordialement,<br/><strong>Direction — ISC Mbujimayi</strong>
    </p>
  `;

  return { subject, html: htmlWrapper(bodyContent) };
}

export function buildStaffRegStatusEmail(params: {
  name: string;
  status: "APPROVED" | "REJECTED";
  roleStaff: string;
  notes?: string | null;
}): { subject: string; html: string } {
  const { name, status, roleStaff, notes } = params;
  const isApproved = status === "APPROVED";

  const subject = isApproved
    ? `[ISC Mbujimayi] ✅ Votre inscription personnel administratif a été approuvée`
    : `[ISC Mbujimayi] ❌ Votre inscription personnel administratif a été rejetée`;

  const statusBadge = isApproved
    ? `<span style="display:inline-block;background:#dcfce7;color:#15803d;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:bold;">✅ APPROUVÉE</span>`
    : `<span style="display:inline-block;background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:bold;">❌ REJETÉE</span>`;

  const bodyContent = `
    ${greeting(name)}
    <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;">
      Voici la décision concernant votre demande d'inscription en tant que <strong>${roleStaff}</strong> à l'${ISC_NAME} :
    </p>
    <div style="text-align:center;margin:20px 0;">${statusBadge}</div>
    ${isApproved
      ? `${alertBox("Félicitations ! Votre dossier a été approuvé. Vous serez contacté(e) prochainement pour finaliser votre intégration.", "success")}
         ${actionButton("Accéder à la plateforme", "https://www.isc-mbujimayi.ac.cd/dashboard")}`
      : `${alertBox("Votre dossier n'a pas pu être approuvé en l'état. Veuillez contacter la direction pour plus d'informations.", "danger")}`
    }
    ${notes ? `<div style="margin:20px 0;"><p style="margin:0 0 8px;color:#475569;font-size:13px;font-weight:bold;">Commentaire :</p><div style="background:#f8fafc;border-left:4px solid ${PRIMARY_COLOR};padding:12px 16px;border-radius:0 6px 6px 0;"><p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">${notes}</p></div></div>` : ""}
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
      Cordialement,<br/><strong>Direction — ISC Mbujimayi</strong>
    </p>
  `;

  return { subject, html: htmlWrapper(bodyContent) };
}

export function buildCertificateIssuedEmail(params: {
  studentName: string;
  courseTitle: string;
  filiereName?: string | null;
  hash: string;
  issuedAt?: Date | null;
}): { subject: string; html: string } {
  const { studentName, courseTitle, filiereName, hash, issuedAt } = params;

  const subject = `[ISC Mbujimayi] 🎓 Votre certificat de réussite est disponible`;
  const dateStr = issuedAt
    ? new Date(issuedAt).toLocaleDateString("fr-CD", { day: "2-digit", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("fr-CD", { day: "2-digit", month: "long", year: "numeric" });

  const rows: [string, string][] = [
    ["Cours complété:", courseTitle],
    ...(filiereName ? [["Filière:", filiereName] as [string, string]] : []),
    ["Date de délivrance:", dateStr],
    ["Code de vérification:", hash.substring(0, 16) + "..."],
  ];

  const bodyContent = `
    ${greeting(studentName)}
    <div style="text-align:center;margin:0 0 24px;">
      <div style="display:inline-block;background:linear-gradient(135deg,${PRIMARY_COLOR},#2563eb);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;color:#ffffff;margin-bottom:12px;">🎓</div>
      <p style="margin:0;color:${PRIMARY_COLOR};font-size:20px;font-weight:bold;">Félicitations !</p>
      <p style="margin:8px 0 0;color:#475569;font-size:14px;">Vous avez obtenu votre certificat de réussite.</p>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
      Nous avons le plaisir de vous informer que vous avez complété avec succès le cours 
      <strong>« ${courseTitle} »</strong> sur la plateforme ISC Mbujimayi. Votre certificat officiel a été généré.
    </p>
    ${infoTable(rows)}
    ${alertBox("Votre certificat PDF est joint à cet email. Vous pouvez également le télécharger à tout moment depuis votre espace personnel.", "info")}
    ${actionButton("Voir mon certificat", `https://www.isc-mbujimayi.ac.cd/dashboard`)}
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
      Ce certificat peut être vérifié en ligne avec le code de validation fourni.<br/>
      Cordialement,<br/><strong>Direction des Études — ISC Mbujimayi</strong>
    </p>
  `;

  return { subject, html: htmlWrapper(bodyContent) };
}

export function buildCourseApprovedEmail(teacherName: string, courseTitle: string): { subject: string; html: string } {
  const subject = `✅ Votre cours « ${courseTitle} » est publié — ISC Mbujimayi`;
  const bodyContent = `
    ${greeting(teacherName)}
    <div style="text-align:center;margin:0 0 24px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#15803d,#22c55e);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;color:#ffffff;margin-bottom:12px;">✅</div>
      <p style="margin:0;color:#15803d;font-size:20px;font-weight:bold;">Cours approuvé et publié !</p>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
      Nous avons le plaisir de vous informer que votre cours <strong>« ${courseTitle} »</strong> a été examiné et 
      <strong style="color:#15803d;">approuvé</strong> par l'administration. Il est maintenant visible par tous les étudiants de la plateforme.
    </p>
    ${infoTable([["Cours :", courseTitle], ["Statut :", "PUBLIÉ"], ["Date d'approbation :", new Date().toLocaleDateString("fr-CD", { day: "2-digit", month: "long", year: "numeric" })]])}
    ${alertBox("Vos étudiants peuvent désormais s'inscrire et suivre ce cours en ligne.", "success")}
    ${actionButton("Voir mon cours", "https://www.isc-mbujimayi.ac.cd/dashboard")}
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
      Cordialement,<br/><strong>Administration — ISC Mbujimayi</strong>
    </p>
  `;
  return { subject, html: htmlWrapper(bodyContent) };
}

export function buildCourseRejectedEmail(teacherName: string, courseTitle: string, rejectionNotes?: string): { subject: string; html: string } {
  const subject = `❌ Votre cours « ${courseTitle} » n'a pas été approuvé — ISC Mbujimayi`;
  const bodyContent = `
    ${greeting(teacherName)}
    <div style="text-align:center;margin:0 0 24px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#dc2626,#ef4444);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;color:#ffffff;margin-bottom:12px;">❌</div>
      <p style="margin:0;color:#dc2626;font-size:20px;font-weight:bold;">Cours non approuvé</p>
    </div>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
      Après examen, votre cours <strong>« ${courseTitle} »</strong> n'a pas pu être approuvé en l'état.
      Vous pouvez le modifier et le soumettre à nouveau pour une nouvelle évaluation.
    </p>
    ${rejectionNotes ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#dc2626;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Motif du rejet</p>
      <p style="margin:0;color:#1e293b;font-size:13px;line-height:1.6;">${rejectionNotes}</p>
    </div>` : ""}
    ${infoTable([["Cours :", courseTitle], ["Statut :", "REJETÉ"]])}
    ${actionButton("Modifier mon cours", "https://www.isc-mbujimayi.ac.cd/dashboard")}
    <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
      Si vous avez des questions, n'hésitez pas à contacter l'administration.<br/>
      Cordialement,<br/><strong>Administration — ISC Mbujimayi</strong>
    </p>
  `;
  return { subject, html: htmlWrapper(bodyContent) };
}
