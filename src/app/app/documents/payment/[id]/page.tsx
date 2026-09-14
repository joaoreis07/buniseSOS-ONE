import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import { getPaymentReceiptView } from "@/modules/documents/services/document.service";
import { DocumentSheet } from "@/modules/documents/components/document-sheet";

export default async function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("finance:view");
  const { id } = await params;
  try {
    const view = await getPaymentReceiptView({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      paymentId: id,
    });
    return <DocumentSheet view={view} />;
  } catch (error) {
    if (error instanceof Error && error.message.includes("não encontrado")) {
      notFound();
    }
    throw error;
  }
}
