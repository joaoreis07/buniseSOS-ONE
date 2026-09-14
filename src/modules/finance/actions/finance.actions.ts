"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/shared/auth/session";
import { receivePaymentSchema } from "@/modules/finance/schemas/finance.schemas";
import { receiveInstallmentPayment } from "@/modules/finance/services/finance.service";

export type FinanceActionResult = { ok: boolean; error?: string };

export async function receivePaymentAction(
  _previous: FinanceActionResult | undefined,
  formData: FormData,
): Promise<FinanceActionResult> {
  const user = await requireSession();
  const parsed = receivePaymentSchema.safeParse({
    installmentId: formData.get("installmentId"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  try {
    const result = await receiveInstallmentPayment({ companyId: user.companyId, userId: user.id, role: user.role, data: parsed.data });
    revalidatePath("/app/finance");
    revalidatePath(`/app/finance/${result.receivableId}`);
    revalidatePath("/app/sales");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Falha ao receber pagamento" };
  }
}
