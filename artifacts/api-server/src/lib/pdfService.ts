import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { join } from "path";
import type { Response } from "express";

const ISC_NAME = "Institut Supérieur de Commerce (ISC) Mbujimayi";
const ISC_ADDRESS = "Avenue Kanshi, Quartier Bipemba, Mbujimayi, RD Congo";
const ISC_PHONE = "+243 81 234 5678";
const ISC_EMAIL = "info@isc-mbujimayi.ac.cd";
const ISC_WEBSITE = "www.isc-mbujimayi.ac.cd";

const LOGO_PATH = join(__dirname, "assets", "logo-isc.jpg");

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

function tryAddLogo(doc: PDFKit.PDFDocument, x: number, y: number, size: number) {
  try {
    doc.image(LOGO_PATH, x, y, { width: size, height: size, fit: [size, size] });
  } catch {
    // logo not available — skip silently
  }
}

function drawReceiptHeader(doc: PDFKit.PDFDocument) {
  const W = doc.page.width;
  doc.rect(0, 0, W, 120).fill("#1a3a6b");

  tryAddLogo(doc, 30, 15, 70);

  doc.fillColor("#ffffff").fontSize(16).font("Helvetica-Bold")
    .text(ISC_NAME, 115, 22, { width: W - 145 });
  doc.fontSize(8.5).font("Helvetica").fillColor("#cbd5e1")
    .text(ISC_ADDRESS, 115, 48, { width: W - 145 })
    .text(`${ISC_PHONE}  ·  ${ISC_EMAIL}`, 115, 60, { width: W - 145 })
    .text(ISC_WEBSITE, 115, 72, { width: W - 145 });

  doc.fillColor("#f59e0b").rect(40, 96, W - 80, 2).fill();
}

function drawReceiptFooter(doc: PDFKit.PDFDocument) {
  const y = doc.page.height - 50;
  doc.fillColor("#94a3b8").rect(40, y - 8, doc.page.width - 80, 1).fill();
  doc.fontSize(8).font("Helvetica").fillColor("#64748b")
    .text(
      `Document généré le ${new Date().toLocaleDateString("fr-CD", { day: "2-digit", month: "long", year: "numeric" })} — ${ISC_NAME}`,
      40, y, { align: "center" },
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

function writeReceiptContent(doc: PDFKit.PDFDocument, data: PaymentReceiptData): void {
  drawReceiptHeader(doc);

  doc.moveDown(4.5);

  doc.fillColor("#1a3a6b").fontSize(16).font("Helvetica-Bold").text("REÇU DE PAIEMENT", { align: "center" });
  doc.fillColor("#64748b").fontSize(10).font("Helvetica").text(`Référence: ${data.reference}`, { align: "center" });

  doc.moveDown(1.5);

  const amountNum = parseFloat(data.amount) || 0;
  const formattedAmount = new Intl.NumberFormat("fr-CD").format(amountNum);
  const boxTop = doc.y;
  doc.rect(40, boxTop, doc.page.width - 80, 60).fill("#f0f9ff").stroke("#bae6fd");
  doc.fillColor("#0369a1").fontSize(12).font("Helvetica-Bold")
    .text("MONTANT PAYÉ", 0, boxTop + 10, { align: "center" });
  doc.fillColor("#1a3a6b").fontSize(22).font("Helvetica-Bold")
    .text(`${formattedAmount} ${data.currency}`, 0, boxTop + 28, { align: "center" });

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
  const noteY = doc.y;
  doc.rect(40, noteY, doc.page.width - 80, 48).fill("#f0fdf4").stroke("#bbf7d0");
  doc.fillColor("#15803d").fontSize(10).font("Helvetica-Bold")
    .text("Ce document constitue un reçu officiel de paiement.", 0, noteY + 8, { align: "center" });
  doc.fillColor("#166534").fontSize(9).font("Helvetica")
    .text("Conservez ce document comme preuve de votre paiement à l'ISC Mbujimayi.", 0, noteY + 24, { align: "center" });

  drawReceiptFooter(doc);
}

export function generatePaymentReceiptPDFBuffer(data: PaymentReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    writeReceiptContent(doc, data);
    doc.end();
  });
}

export function generatePaymentReceiptPDF(data: PaymentReceiptData, res: Response): void {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="recu-${data.reference}.pdf"`);
  doc.pipe(res);
  writeReceiptContent(doc, data);
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
  verifyUrl?: string;
}

async function writeCertificateContent(doc: PDFKit.PDFDocument, data: CertificateData): Promise<void> {
  let qrBuffer: Buffer | null = null;
  const verifyUrl = data.verifyUrl ?? `https://${ISC_WEBSITE}/verify/${data.hash}`;
  try {
    qrBuffer = await QRCode.toBuffer(verifyUrl, { type: "png", width: 120, margin: 1 });
  } catch {
    // QR generation failed — skip
  }

  const W = doc.page.width;
  const H = doc.page.height;

  doc.rect(0, 0, W, H).fill("#0f1e3d");
  doc.rect(20, 20, W - 40, H - 40).fill("#ffffff");
  doc.rect(28, 28, W - 56, H - 56).undash().stroke("#c9a84c").lineWidth(2);
  doc.rect(32, 32, W - 64, H - 64).stroke("#c9a84c").lineWidth(0.5);

  doc.fillColor("#0f1e3d").rect(50, 50, W - 100, 60).fill();

  tryAddLogo(doc, 58, 54, 50);

  doc.fillColor("#c9a84c").fontSize(9).font("Helvetica").text(
    ISC_NAME.toUpperCase(), 120, 60, { width: W - 200, align: "center", characterSpacing: 2 },
  );
  doc.fillColor("#ffffff").fontSize(7).text(ISC_ADDRESS, 120, 78, { width: W - 200, align: "center" });

  doc.fillColor("#0f1e3d").fontSize(24).font("Helvetica-Bold")
    .text("CERTIFICAT DE RÉUSSITE", 0, 124, { align: "center", characterSpacing: 1 });

  doc.fillColor("#64748b").fontSize(11).font("Helvetica")
    .text("Ce certificat est décerné à", 0, 162, { align: "center" });

  doc.fillColor("#c9a84c").rect(W / 2 - 180, 184, 360, 2).fill();
  doc.fillColor("#0f1e3d").fontSize(26).font("Helvetica-Bold")
    .text(data.studentName, 0, 192, { align: "center" });
  doc.fillColor("#c9a84c").rect(W / 2 - 180, 228, 360, 2).fill();

  doc.fillColor("#374151").fontSize(9).font("Helvetica")
    .text(`N° Étudiant: ${data.numEtudiant}`, 0, 238, { align: "center" });

  doc.fillColor("#475569").fontSize(10).font("Helvetica")
    .text("pour avoir complété avec succès le cours", 0, 260, { align: "center" });
  doc.fillColor("#1a3a6b").fontSize(15).font("Helvetica-Bold")
    .text(`« ${data.courseTitle} »`, 0, 278, { align: "center" });

  if (data.filiereName) {
    doc.fillColor("#64748b").fontSize(9).font("Helvetica")
      .text(`Filière: ${data.filiereName}`, 0, 302, { align: "center" });
  }

  if (data.score != null) {
    doc.fillColor("#0f1e3d").fontSize(11).font("Helvetica-Bold")
      .text(`Score: ${data.score}%`, 0, 320, { align: "center" });
  }

  const sigY = H - 130;
  const leftX = 80;
  const rightX = W - 240;

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

  if (qrBuffer) {
    const qrSize = 80;
    const qrX = W / 2 - qrSize / 2;
    const qrY = H - 140;
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    doc.fillColor("#94a3b8").fontSize(6.5).text("Scannez pour vérifier", qrX - 10, qrY + qrSize + 2, { width: qrSize + 20, align: "center" });
  }

  doc.fillColor("#94a3b8").fontSize(7).text(`Délivré le ${issuedDate}`, 0, H - 46, { align: "center" });
  doc.fillColor("#cbd5e1").fontSize(6.5).text(`Code: ${data.hash}`, 0, H - 34, { align: "center" });
}

export async function generateCertificatePDFBuffer(data: CertificateData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 50 });
  const chunks: Buffer[] = [];

  const streamDone = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  try {
    await writeCertificateContent(doc, data);
  } catch (err) {
    doc.end();
    throw err;
  }

  doc.end();
  return streamDone;
}

export async function generateCertificatePDF(data: CertificateData, res: Response): Promise<void> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="certificat-${data.hash.substring(0, 8)}.pdf"`);
  doc.pipe(res);
  await writeCertificateContent(doc, data);
  doc.end();
}
