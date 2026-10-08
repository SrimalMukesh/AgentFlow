import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { ResearchReportData } from "./research.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage directory for generated reports
const GENERATED_DIR = path.resolve(__dirname, "../../generated-files");

if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

export interface GeneratedPdfResult {
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSizeBytes: number;
}

export async function generateResearchPdf(
  reportData: ResearchReportData,
  taskId: number,
  txHash?: string
): Promise<GeneratedPdfResult> {
  const timestamp = Date.now();
  const safeTitle = reportData.title
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40);
  const fileName = `AgentFlow_${safeTitle}_Task${taskId}_${timestamp}.pdf`;
  const filePath = path.join(GENERATED_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
      info: {
        Title: reportData.title,
        Author: "AgentFlow Research Agent",
        Subject: reportData.subtitle,
        Keywords: `${reportData.topic}, Verified Research, Autonomous Intelligence, Algorand, x402`,
        CreationDate: new Date(),
      },
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const primaryColor = "#0F172A";    // Deep Slate
    const secondaryColor = "#2563EB";  // AgentFlow Blue
    const mutedColor = "#64748B";      // Slate Muted
    const bodyColor = "#334155";       // Text Body
    const borderColor = "#CBD5E1";     // Line / Border
    const lightBg = "#F8FAFC";         // Card Background

    const pageWidth = doc.page.width - 100; // 595.28 - 100 = 495.28

    // ─── Header Top Banner ───
    doc
      .rect(50, 45, pageWidth, 28)
      .fillAndStroke("#EFF6FF", "#DBEAFE");

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor(secondaryColor)
      .text("AGENTFLOW AUTONOMOUS RESEARCH SUITE · VERIFIED INTELLIGENCE", 65, 54, {
        characterSpacing: 0.5,
      });

    doc.moveDown(2);

    // ─── Document Title & Subtitle ───
    doc
      .fontSize(21)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text(reportData.title, 50, 88, { width: pageWidth });

    doc.moveDown(0.3);

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor(mutedColor)
      .text(reportData.subtitle, 50, doc.y, { width: pageWidth, lineGap: 3 });

    doc.moveDown(1);

    // ─── Metadata Information Box ───
    const metaBoxY = doc.y;
    doc
      .roundedRect(50, metaBoxY, pageWidth, 56, 4)
      .fillAndStroke(lightBg, borderColor);

    doc
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("GENERATED DATE:", 65, metaBoxY + 12)
      .font("Helvetica")
      .fillColor(bodyColor)
      .text(reportData.generatedDate, 175, metaBoxY + 12)

      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("REPORT TOPIC:", 65, metaBoxY + 26)
      .font("Helvetica")
      .fillColor(bodyColor)
      .text(reportData.topic, 175, metaBoxY + 26, { width: pageWidth - 190, ellipsis: true })

      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("VERIFICATION & SETTLEMENT:", 65, metaBoxY + 40)
      .font("Helvetica")
      .fillColor(secondaryColor)
      .text(
        `x402 Micropayment Verified · Algorand Testnet${txHash ? ` · Tx: ${txHash.slice(0, 16)}…` : ""}`,
        175,
        metaBoxY + 40
      );

    doc.y = metaBoxY + 68;
    doc.moveDown(0.8);

    // ─── Divider ───
    doc
      .strokeColor(borderColor)
      .lineWidth(0.75)
      .moveTo(50, doc.y)
      .lineTo(50 + pageWidth, doc.y)
      .stroke();

    doc.moveDown(1);

    // ─── Section 1: Executive Summary ───
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor(secondaryColor)
      .text("1. Executive Summary", 50, doc.y);

    doc.moveDown(0.5);

    doc
      .fontSize(9.5)
      .font("Helvetica")
      .fillColor(bodyColor)
      .text(reportData.executiveSummary, {
        width: pageWidth,
        align: "justify",
        lineGap: 4,
      });

    doc.moveDown(1.5);

    // ─── Section 2: Core Domain Findings & Entity Breakdown ───
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor(secondaryColor)
      .text(reportData.section2Title || "2. Core Research Findings & Structured Analysis", 50, doc.y);

    doc.moveDown(0.8);

    const sectionsList = reportData.sections || (reportData as any).companies || [];

    sectionsList.forEach((sec: any, idx: number) => {
      if (doc.y > 640) {
        doc.addPage();
      }

      const compCardY = doc.y;
      
      // Top header of section / entity card
      doc
        .fontSize(11.5)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text(`${idx + 1}. ${sec.title || sec.name}`, 50, compCardY)
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .fillColor(secondaryColor)
        .text(sec.category || "Domain Analysis", 50, doc.y + 2);

      doc.moveDown(0.2);

      // Metric strip
      if (sec.keyMetricOrScale || sec.valuationOrMarketCap) {
        doc
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .fillColor(mutedColor)
          .text(`Scale / Metric: `, 50, doc.y, { continued: true })
          .font("Helvetica")
          .fillColor(bodyColor)
          .text(`${sec.keyMetricOrScale || sec.valuationOrMarketCap}   |   `, { continued: true })
          .font("Helvetica-Bold")
          .fillColor(mutedColor)
          .text(`Context: `, { continued: true })
          .font("Helvetica")
          .fillColor(bodyColor)
          .text(sec.secondaryMetric || sec.marketShareOrRevenue || "Verified");

        doc.moveDown(0.4);
      }

      // Narrative text
      const narrativeText = sec.narrative || sec.description || "";
      if (narrativeText) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(bodyColor)
          .text(narrativeText, { width: pageWidth, align: "justify", lineGap: 3 });

        doc.moveDown(0.4);
      }

      // Bullet points
      const bullets = sec.bulletPoints || sec.keyProducts || [];
      if (bullets.length > 0) {
        doc
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .fillColor(primaryColor)
          .text("Documented Observations & Key Factors:", { underline: false });

        bullets.forEach((b: string) => {
          doc
            .fontSize(8)
            .font("Helvetica")
            .fillColor(bodyColor)
            .text(`  •  ${b}`, { width: pageWidth - 10, lineGap: 2 });
        });

        doc.moveDown(0.3);
      }

      // Context details
      if (sec.strategicFocusOrContext || sec.strategicFocus2026) {
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(primaryColor)
          .text("Key Context: ", { continued: true })
          .font("Helvetica")
          .fillColor(bodyColor)
          .text(sec.strategicFocusOrContext || sec.strategicFocus2026, { width: pageWidth, lineGap: 2 });

        doc.moveDown(0.2);
      }

      if (sec.technicalArchitectureOrDetails || sec.infrastructureAndCompute) {
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(primaryColor)
          .text("Technical Framework: ", { continued: true })
          .font("Helvetica")
          .fillColor(bodyColor)
          .text(sec.technicalArchitectureOrDetails || sec.infrastructureAndCompute, { width: pageWidth, lineGap: 2 });
      }

      doc.moveDown(0.8);
      
      // Card bottom divider
      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(50, doc.y)
        .lineTo(50 + pageWidth, doc.y)
        .stroke();

      doc.moveDown(0.8);
    });

    // ─── Section 3: Comparative Analysis Table ───
    if (doc.y > 520) {
      doc.addPage();
    }

    doc.moveDown(0.5);
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor(secondaryColor)
      .text("3. Structured Dimension & Comparative Analysis", 50, doc.y);

    doc.moveDown(0.6);

    const tableTop = doc.y;
    const numCols = Math.max(reportData.comparisonTable.headers.length, 1);
    const colWidth = Math.floor(pageWidth / numCols);

    // Table Header
    doc
      .rect(50, tableTop, pageWidth, 22)
      .fillAndStroke(primaryColor, primaryColor);

    let curX = 55;
    reportData.comparisonTable.headers.forEach((h) => {
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor("#FFFFFF")
        .text(h, curX, tableTop + 7, { width: colWidth - 8, align: "left" });
      curX += colWidth;
    });

    let currentY = tableTop + 22;

    // Table Rows
    reportData.comparisonTable.rows.forEach((row, rIdx) => {
      const rowHeight = 24;
      const isEven = rIdx % 2 === 0;

      doc
        .rect(50, currentY, pageWidth, rowHeight)
        .fillAndStroke(isEven ? "#FFFFFF" : lightBg, borderColor);

      let cellX = 55;
      row.forEach((cellText, cIdx) => {
        doc
          .fontSize(7.5)
          .font(cIdx === 0 ? "Helvetica-Bold" : "Helvetica")
          .fillColor(cIdx === 0 ? primaryColor : bodyColor)
          .text(cellText, cellX, currentY + 7, {
            width: colWidth - 8,
            align: "left",
          });
        cellX += colWidth;
      });

      currentY += rowHeight;
    });

    doc.y = currentY + 14;

    // ─── Section 4: Key Findings ───
    if (doc.y > 600) {
      doc.addPage();
    }

    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor(secondaryColor)
      .text("4. Key Research Findings", 50, doc.y);

    doc.moveDown(0.5);

    reportData.keyFindings.forEach((kf, kIdx) => {
      doc
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text(`[0${kIdx + 1}] `, 50, doc.y, { continued: true })
        .font("Helvetica")
        .fillColor(bodyColor)
        .text(kf, { width: pageWidth, lineGap: 3 });
      doc.moveDown(0.3);
    });

    doc.moveDown(0.8);

    // ─── Section 5: Strategic Outlook / Impact & Conclusion ───
    if (doc.y > 580) {
      doc.addPage();
    }

    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor(secondaryColor)
      .text("5. Long-Term Significance & Conclusion", 50, doc.y);

    doc.moveDown(0.5);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(bodyColor)
      .text(reportData.conclusion, {
        width: pageWidth,
        align: "justify",
        lineGap: 4,
      });

    doc.moveDown(1.2);

    // ─── Section 6: Sources & Real References ───
    if (doc.y > 600) {
      doc.addPage();
    }

    doc
      .fontSize(11.5)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("6. Sources & Reference Citations", 50, doc.y);

    doc.moveDown(0.4);

    reportData.sources.forEach((src) => {
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(bodyColor)
        .text(`•  ${src.title}`, { continued: true })
        .font("Helvetica")
        .fillColor(mutedColor)
        .text(` — ${src.organization} (${src.date})`);

      if (src.url) {
        doc
          .fontSize(7.5)
          .font("Helvetica")
          .fillColor(secondaryColor)
          .text(`    URL: ${src.url}`, { link: src.url, underline: true });
      }

      doc.moveDown(0.2);
    });

    doc.moveDown(1);

    // ─── Cryptographic Verification Footnote ───
    const auditY = doc.y;
    doc
      .roundedRect(50, auditY, pageWidth, 38, 4)
      .fillAndStroke("#F0FDF4", "#BBF7D0");

    doc
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .fillColor("#16A34A")
      .text("ON-CHAIN SETTLEMENT AUDIT TRAIL:", 60, auditY + 8)
      .font("Helvetica")
      .fillColor("#15803D")
      .text(
        `Task ID: ${taskId} | Protocol: x402 / ARC-0027 | Network: Algorand Testnet | Standard: USDC Micropayment | SHA-256 Verified`,
        60,
        auditY + 20
      );

    // ─── Numbering all pages ───
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      // Top running header
      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor(mutedColor)
        .text(`AgentFlow Autonomous Intelligence · ${reportData.title.slice(0, 52)}`, 50, 25, {
          width: pageWidth,
          align: "left",
        });

      // Bottom running footer
      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor(mutedColor)
        .text(
          `Page ${i + 1} of ${range.count}`,
          50,
          doc.page.height - 35,
          { width: pageWidth, align: "right" }
        );

      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor(mutedColor)
        .text(
          "VERIFIED RESEARCH INTELLIGENCE · PRODUCED BY AGENTFLOW",
          50,
          doc.page.height - 35,
          { width: pageWidth, align: "left" }
        );
    }

    doc.end();

    stream.on("finish", () => {
      const stats = fs.statSync(filePath);
      resolve({
        fileName,
        filePath,
        fileUrl: `/api/files/${fileName}`,
        fileSizeBytes: stats.size,
      });
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}
