import { NextResponse } from "next/server";
import { requirePermission } from "@/shared/auth/session";
import { renderPurchaseRecordPdf } from "@/modules/documents/services/document.service";
import { formatOperationalDocumentNumber } from "@/modules/documents/lib/document-labels";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requirePermission("purchases:view");
  const { id } = await context.params;
  try {
    const { view, bytes } = await renderPurchaseRecordPdf({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      purchaseId: id,
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
