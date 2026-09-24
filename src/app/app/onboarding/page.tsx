import { requireSession } from "@/shared/auth/session";
import { prisma } from "@/shared/db/prisma";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/modules/onboarding/components/onboarding-form";

export default async function OnboardingPage() {
  const user = await requireSession();
  const company = await prisma.company.findFirst({
    where: { id: user.companyId, deletedAt: null },
    include: {
      settings: { select: { onboardingCompletedAt: true, displayName: true } },
    },
  });

  if (company?.settings?.onboardingCompletedAt) {
    redirect("/app");
  }

  return (
    <div className="min-h-[calc(100vh-var(--bos-topbar-height))] bg-[var(--bos-background)]">
      <OnboardingForm
        companyName={company?.settings?.displayName?.trim() || company?.name || ""}
        userName={user.name ?? "Usuário"}
      />
    </div>
  );
}
