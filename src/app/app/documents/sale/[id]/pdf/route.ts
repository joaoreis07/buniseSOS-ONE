import { NextResponse } from "next/server";
import { requirePermission } from "@/shared/auth/session";
import { renderSaleReceiptPdf } from "@/modules/documents/services/document.service";
import { formatOperationalDocumentNumber } from "@/modules/documents/lib/document-labels";
import { publicErrorMessage } from "@/shared/errors/public-error";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requirePermission("sales:view");
  const { id } = await context.params;
  try {
    const { view, bytes } = await renderSaleReceiptPdf({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      saleId: id,
    });
    const filename = `${formatOperationalDocumentNumber(view.document.kind, view.document.number)}.pdf`;
    return new NextResponse(Uint8Array.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = publicErrorMessage(error, "Falha ao gerar PDF");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
