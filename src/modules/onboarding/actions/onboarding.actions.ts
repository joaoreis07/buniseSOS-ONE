"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/shared/auth/session";
import { prisma } from "@/shared/db/prisma";
import { writeAuditLog } from "@/shared/audit/audit";

export type OnboardingActionResult = { ok: boolean; error?: string };

export async function completeOnboardingAction(
  _prev: OnboardingActionResult | undefined,
  formData: FormData,
): Promise<OnboardingActionResult> {
  const user = await requireSession();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const document = String(formData.get("document") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!displayName) {
    return { ok: false, error: "Informe o nome da empresa" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: user.companyId },
      data: {
        name: displayName,
        document: document || undefined,
        phone: phone || undefined,
      },
    });
    await tx.companySettings.update({
      where: { companyId: user.companyId },
      data: {
        displayName,
        onboardingCompletedAt: new Date(),
      },
    });
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    module: "settings",
    action: "ONBOARDING_COMPLETE",
    entity: "CompanySettings",
    metadata: { displayName },
  });

  revalidatePath("/app");
  redirect("/app");
}
