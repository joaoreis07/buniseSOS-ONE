import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import { getPurchaseRecordView } from "@/modules/documents/services/document.service";
import { DocumentSheet } from "@/modules/documents/components/document-sheet";

export default async function PurchaseDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("purchases:view");
  const { id } = await params;
  try {
    const view = await getPurchaseRecordView({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      purchaseId: id,
    });
    return <DocumentSheet view={view} />;
  } catch (error) {
    if (error instanceof Error && error.message.includes("não encontrada")) {
      notFound();
    }
    throw error;
  }
}
