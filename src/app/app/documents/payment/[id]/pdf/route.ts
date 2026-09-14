import { NextResponse } from "next/server";
import { requirePermission } from "@/shared/auth/session";
import { renderPaymentReceiptPdf } from "@/modules/documents/services/document.service";
import { formatOperationalDocumentNumber } from "@/modules/documents/lib/document-labels";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requirePermission("finance:view");
  const { id } = await context.params;
  try {
    const { view, bytes } = await renderPaymentReceiptPdf({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      paymentId: id,
    });
    const filename = `${formatOperationalDocumentNumber(view.document.kind, view.document.number)}.pdf`;
    return new NextResponse(Uint8Array.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao gerar PDF";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
