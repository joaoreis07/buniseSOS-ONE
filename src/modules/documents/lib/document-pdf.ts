import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  DOCUMENT_KIND_LABELS,
  formatOperationalDocumentNumber,
  hexToRgb,
} from "@/modules/documents/lib/document-labels";
import type { OperationalDocumentView } from "@/modules/documents/lib/document-view";

function toWinAnsi(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[—–−]/g, "-")
    .replace(/[·•]/g, "-")
    .replace(/[^\x20-\x7E]/g, "?");
}

function wrapText(text: string, maxChars: number) {
  const lines: string[] = [];
  for (const raw of toWinAnsi(text).split(/\r?\n/)) {
    const paragraph = raw.trimEnd();
    if (!paragraph) {
      lines.push("");
      continue;
    }
    let remaining = paragraph;
    while (remaining.length > maxChars) {
      const slice = remaining.slice(0, maxChars);
      const breakAt = slice.lastIndexOf(" ");
      const take = breakAt > 20 ? breakAt : maxChars;
      lines.push(remaining.slice(0, take).trimEnd());
      remaining = remaining.slice(take).trimStart();
    }
    if (remaining) lines.push(remaining);
  }
  return lines;
}

function write(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    size: number;
    font: PDFFont;
    color?: ReturnType<typeof rgb>;
  },
) {
  const safe = toWinAnsi(text) || " ";
  page.drawText(safe, options);
}

export async function renderOperationalDocumentPdf(
  view: OperationalDocumentView,
  logo?: { buffer: Buffer; kind: "jpeg" | "png" } | null,
) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const primary = hexToRgb(view.branding.primaryColor);
  const color = rgb(primary.r / 255, primary.g / 255, primary.b / 255);

  let y = 812;
  page.drawRectangle({
    x: 0,
    y: 820,
    width: 595.28,
    height: 22,
    color,
  });

  if (logo) {
    const image =
      logo.kind === "png"
        ? await pdf.embedPng(logo.buffer)
        : await pdf.embedJpg(logo.buffer);
    const size = image.scaleToFit(90, 42);
    page.drawImage(image, {
      x: 40,
      y: y - size.height + 8,
      width: size.width,
      height: size.height,
    });
  }

  const title = view.branding.documentTitle || DOCUMENT_KIND_LABELS[view.document.kind];
  write(page, title, {
    x: logo ? 150 : 40,
    y,
    size: 16,
    font: bold,
    color,
  });
  y -= 18;
  write(page, view.company.displayName, {
    x: logo ? 150 : 40,
    y,
    size: 11,
    font: bold,
  });
  y -= 14;
  const contact = [
    view.company.document,
    view.company.email,
    view.company.phone,
    view.company.whatsapp,
  ]
    .filter(Boolean)
    .join(" · ");
  if (contact) {
    write(page, contact.slice(0, 90), { x: logo ? 150 : 40, y, size: 9, font });
    y -= 12;
  }
  y -= 8;
  write(page, "Documento operacional - sem validade fiscal", {
    x: 40,
    y,
    size: 8,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 22;

  const number = formatOperationalDocumentNumber(
    view.document.kind,
    view.document.number,
  );
  write(page, `${number}  -  ${view.issuedAtLabel}`, {
    x: 40,
    y,
    size: 10,
    font: bold,
  });
  y -= 18;

  if (view.branding.documentHeader) {
    for (const line of wrapText(view.branding.documentHeader, 90).slice(0, 4)) {
      write(page, line || " ", { x: 40, y, size: 9, font });
      y -= 12;
    }
    y -= 6;
  }

  for (const field of view.fields) {
    write(page, `${field.label}:`, { x: 40, y, size: 9, font: bold });
    write(page, String(field.value ?? "-").slice(0, 70), {
      x: 150,
      y,
      size: 9,
      font,
    });
    y -= 14;
  }

  if (view.lines.length > 0) {
    y -= 8;
    write(page, "Itens", { x: 40, y, size: 11, font: bold });
    y -= 16;
    for (const line of view.lines.slice(0, 18)) {
      const row = `${line.quantity} x ${line.description}`.slice(0, 62);
      write(page, row, { x: 40, y, size: 9, font });
      write(page, line.total, { x: 460, y, size: 9, font });
      y -= 13;
    }
    if (view.lines.length > 18) {
      write(page, "Lista resumida neste PDF. Use a impressao para o detalhe completo.", {
        x: 40,
        y,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 12;
    }
  }

  if (view.totals.length > 0) {
    y -= 8;
    for (const total of view.totals) {
      write(page, total.label, { x: 360, y, size: 9, font: total.emphasize ? bold : font });
      write(page, total.value, { x: 460, y, size: 9, font: total.emphasize ? bold : font });
      y -= 13;
    }
  }

  if (view.notes) {
    y -= 8;
    write(page, "Observacoes", { x: 40, y, size: 10, font: bold });
    y -= 14;
    for (const line of wrapText(view.notes, 90).slice(0, 6)) {
      write(page, line || " ", { x: 40, y, size: 9, font });
      y -= 12;
    }
  }

  page.drawLine({
    start: { x: 40, y: 70 },
    end: { x: 555, y: 70 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  const footer = [
    view.branding.documentFooter,
    view.branding.signature,
    `${view.company.displayName} - ${number}`,
  ]
    .filter(Boolean)
    .join(" - ")
    .slice(0, 110);
  write(page, footer || " ", { x: 40, y: 52, size: 8, font });
  write(page, "Documento operacional. Nao possui validade fiscal.", {
    x: 40,
    y: 38,
    size: 8,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  return pdf.save();
}
