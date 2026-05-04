import PDFDocument from "pdfkit";
import type { Response } from "express";

const ISC_NAME = "Institut Supérieur de Commerce (ISC) Mbujimayi";
const ISC_ADDRESS = "Avenue Kanshi, Quartier Bipemba, Mbujimayi, RD Congo";
const ISC_PHONE = "+243 81 234 5678";
const ISC_EMAIL = "info@isc-mbujimayi.ac.cd";
const ISC_WEBSITE = "www.isc-mbujimayi.ac.cd";

const OPERATOR_LABELS: Record<string, string> = {
  MTN_MONEY: "MTN Mobile Money",
  AIRTEL_MONEY: "Airtel Money",
  ORANGE_MONEY: "Orange Money",
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  INSCRIPTION_FEE: "Frais d'inscription",
  COURSE_FEE: "Frais de cours",
  EXAM_FEE: "Frais d'examen",
  LATE_FEE: "Pénalité de retard",
  CERTIFICATE_FEE: "Frais de certificat",
  OTHER: "Autre",
};

function drawHeader(doc: PDFKit.PDFDocument) {
  doc.rect(0, 0, doc.page.width, 110).fill("#1a3a6b");
  doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold").text(ISC_NAME, 40, 25, { align: "center" });
  doc.fontSize(9).font("Helvetica").fillColor("#cbd5e1");
  doc.text(`${ISC_ADDRESS} | ${ISC_PHONE} | ${ISC_EMAIL}`, 40, 52, { align: "center" });
  doc.text(ISC_WEBSITE, 40, 66, { align: "center" });
  doc.fillColor("#f59e0b").rect(40, 82, doc.page.width - 80, 2).fill();
}

function drawFooter(doc: PDFKit.PDFDocument) {
  const y = doc.page.height - 50;
  doc.fillColor("#94a3b8").rect(40, y - 8, doc.page.width - 80, 1).fill();
  doc.fontSize(8).font("Helvetica").fillColor("#64748b");
  doc.text(
    `Document généré le ${new Date().toLocaleDateString("fr-CD", { day: "2-digit", month: "long", year: "numeric" })} — ${ISC_NAME}`,
    40,
    y,
    { align: "center" },
  );
}

export interface PaymentReceiptData {
  reference: string;
  amount: string;
  currency: string;
  type: string;
  operator: string;
  phoneNumber: string | null;
  operatorRef: string | null;
  status: string;
  createdAt: Date | null;
  studentName: string;
  numEtudiant: string;
  filiereName?: string | null;
}

export function generatePaymentReceiptPDF(data: PaymentReceiptData, res: Response): void {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="recu-${data.reference}.pdf"`);
  doc.pipe(res);

  drawHeader(doc);

  doc.moveDown(4.5);

  doc.fillColor("#1a3a6b").fontSize(16).font("Helvetica-Bold").text("REÇU DE PAIEMENT", { align: "center" });
  doc.fillColor("#64748b").fontSize(10).font("Helvetica").text(`Référence: ${data.reference}`, { align: "center" });

  doc.moveDown(1.5);

  const amountNum = parseFloat(data.amount) || 0;
  const formattedAmount = new Intl.NumberFormat("fr-CD").format(amountNum);
  doc.rect(40, doc.y, doc.page.width - 80, 60).fill("#f0f9ff").stroke("#bae6fd");
  const boxY = doc.y - 60;
  doc.fillColor("#0369a1").fontSize(12).font("Helvetica-Bold").text("MONTANT PAYÉ", 0, boxY + 12, { align: "center" });
  doc.fillColor("#1a3a6b").fontSize(24).font("Helvetica-Bold").text(`${formattedAmount} ${data.currency}`, 0, boxY + 28, { align: "center" });

  doc.moveDown(0.8);

  const labelX = 60;
  const valueX = 260;
  const lineH = 24;
  let rowY = doc.y + 10;

  const rows: [string, string][] = [
    ["Étudiant:", data.studentName],
    ["N° Étudiant:", data.numEtudiant],
    ...(data.filiereName ? [["Filière:", data.filiereName] as [string, string]] : []),
    ["Type de paiement:", PAYMENT_TYPE_LABELS[data.type] ?? data.type],
    ["Opérateur:", OPERATOR_LABELS[data.operator] ?? data.operator],
    ...(data.phoneNumber ? [["Numéro de téléphone:", data.phoneNumber] as [string, string]] : []),
    ...(data.operatorRef ? [["Référence opérateur:", data.operatorRef] as [string, string]] : []),
    ["Statut:", data.status === "CONFIRMED" ? "✓ Confirmé" : data.status],
    ["Date:", data.createdAt ? new Date(data.createdAt).toLocaleString("fr-CD") : "-"],
  ];

  for (let i = 0; i < rows.length; i++) {
    const [label, value] = rows[i];
    if (i % 2 === 0) {
      doc.rect(labelX - 10, rowY - 4, doc.page.width - (labelX - 10) * 2, lineH).fill("#f8fafc");
    }
    doc.fillColor("#475569").fontSize(10).font("Helvetica-Bold").text(label, labelX, rowY);
    doc.fillColor("#1e293b").font("Helvetica").text(value, valueX, rowY, { width: doc.page.width - valueX - 60 });
    rowY += lineH;
  }

  doc.moveDown(2);
  doc.rect(40, doc.y, doc.page.width - 80, 48).fill("#f0fdf4").stroke("#bbf7d0");
  const noteY = doc.y - 48;
  doc.fillColor("#15803d").fontSize(10).font("Helvetica-Bold").text("Ce document constitue un reçu officiel de paiement.", 0, noteY + 8, { align: "center" });
  doc.fillColor("#166534").fontSize(9).font("Helvetica").text(
    "Conservez ce document comme preuve de votre paiement à l'ISC Mbujimayi.",
    0, noteY + 24, { align: "center" },
  );

  drawFooter(doc);
  doc.end();
}

export interface CertificateData {
  hash: string;
  issuedAt: Date | null;
  studentName: string;
  numEtudiant: string;
  courseTitle: string;
  teacherName: string;
  filiereName?: string | null;
  score?: number | null;
}

export function generateCertificatePDF(data: CertificateData, res: Response): void {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="certificat-${data.hash.substring(0, 8)}.pdf"`);
  doc.pipe(res);

  const W = doc.page.width;
  const H = doc.page.height;

  doc.rect(0, 0, W, H).fill("#0f1e3d");
  doc.rect(20, 20, W - 40, H - 40).fill("#ffffff");

  doc.rect(28, 28, W - 56, H - 56).undash().stroke("#c9a84c").lineWidth(2);
  doc.rect(32, 32, W - 64, H - 64).stroke("#c9a84c").lineWidth(0.5);

  doc.fillColor("#0f1e3d").rect(50, 50, W - 100, 55).fill();
  doc.fillColor("#c9a84c").fontSize(9).font("Helvetica").text(ISC_NAME.toUpperCase(), 0, 58, { align: "center", characterSpacing: 2 });
  doc.fillColor("#ffffff").fontSize(7).text(ISC_ADDRESS, 0, 74, { align: "center" });

  doc.fillColor("#0f1e3d").fontSize(26).font("Helvetica-Bold").text("CERTIFICAT DE RÉUSSITE", 0, 118, { align: "center", characterSpacing: 1 });

  doc.fillColor("#64748b").fontSize(11).font("Helvetica").text("Ce certificat est décerné à", 0, 158, { align: "center" });

  doc.fillColor("#c9a84c").rect(W / 2 - 180, 180, 360, 2).fill();
  doc.fillColor("#0f1e3d").fontSize(28).font("Helvetica-Bold").text(data.studentName, 0, 190, { align: "center" });
  doc.fillColor("#c9a84c").rect(W / 2 - 180, 226, 360, 2).fill();

  doc.fillColor("#374151").fontSize(10).font("Helvetica");
  doc.text(`N° Étudiant: ${data.numEtudiant}`, 0, 238, { align: "center" });

  doc.fillColor("#475569").fontSize(11).font("Helvetica").text("pour avoir complété avec succès le cours", 0, 262, { align: "center" });
  doc.fillColor("#1a3a6b").fontSize(16).font("Helvetica-Bold").text(`« ${data.courseTitle} »`, 0, 282, { align: "center" });

  if (data.filiereName) {
    doc.fillColor("#64748b").fontSize(10).font("Helvetica").text(`Filière: ${data.filiereName}`, 0, 308, { align: "center" });
  }

  if (data.score != null) {
    doc.fillColor("#0f1e3d").fontSize(12).font("Helvetica-Bold").text(`Score: ${data.score}%`, 0, 328, { align: "center" });
  }

  const sigY = H - 130;
  const leftX = 100;
  const rightX = W - 260;

  doc.fillColor("#374151").fontSize(9).font("Helvetica");
  doc.text(`Prof. ${data.teacherName}`, leftX, sigY, { width: 160, align: "center" });
  doc.rect(leftX, sigY + 16, 160, 1).fill("#0f1e3d");
  doc.fillColor("#64748b").fontSize(8).text("Enseignant Responsable", leftX, sigY + 20, { width: 160, align: "center" });

  const issuedDate = data.issuedAt
    ? new Date(data.issuedAt).toLocaleDateString("fr-CD", { day: "2-digit", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("fr-CD", { day: "2-digit", month: "long", year: "numeric" });

  doc.fillColor("#374151").fontSize(9).font("Helvetica");
  doc.text("Le Directeur Général", rightX, sigY, { width: 160, align: "center" });
  doc.rect(rightX, sigY + 16, 160, 1).fill("#0f1e3d");
  doc.fillColor("#64748b").fontSize(8).text("ISC Mbujimayi", rightX, sigY + 20, { width: 160, align: "center" });

  doc.fillColor("#94a3b8").fontSize(7).text(`Délivré le ${issuedDate}`, 0, H - 90, { align: "center" });
  doc.fillColor("#cbd5e1").fontSize(7).text(`Code de vérification: ${data.hash}`, 0, H - 76, { align: "center" });
  doc.fillColor("#94a3b8").text(`Vérifiez l'authenticité sur ${ISC_WEBSITE}/verify`, 0, H - 62, { align: "center" });

  doc.end();
}
