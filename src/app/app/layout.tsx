import { requireSession } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { AppShell } from "@/modules/app-shell/components/app-shell";
import { listNotificationsForTenant } from "@/modules/communications/services/notification.service";
import {
  companyDisplayName,
  getCompanyShellData,
} from "@/modules/app-shell/loaders/company-shell";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isBillingEnforced, isBillingExemptPath } from "@/modules/billing/lib/env";
import { hasProductAccess } from "@/modules/billing/services/access.service";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();
  const headerList = await headers();
  const pathname = headerList.get("x-pathname");
  const company = await getCompanyShellData(user.companyId);
  const displayName = companyDisplayName(company);

  if (pathname !== "/app/onboarding" && !company?.settings?.onboardingCompletedAt) {
    redirect("/app/onboarding");
  }

  if (pathname === "/app/onboarding") {
    return (
      <AppShell user={user} companyName={displayName} pathname={pathname} notifications={null}>
        {children}
      </AppShell>
    );
  }

  if (isBillingEnforced()) {
    const allowed = await hasProductAccess(user.companyId, "ONE");
    if (!allowed) {
      if (hasPermission(user.role, "billing:view") && isBillingExemptPath(pathname)) {
        // billing page
      } else if (hasPermission(user.role, "billing:view")) {
        redirect("/app/settings/billing?blocked=1");
      } else if (!isBillingExemptPath(pathname)) {
        return (
          <AppShell
            user={user}
            companyName="Empresa"
            pathname={pathname}
            notifications={null}
          >
            <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
              <h1 className="text-xl font-semibold">Assinatura pendente</h1>
              <p className="text-muted-foreground">
                Esta empresa não possui acesso ativo ao BusinessOS One. Peça a um
                administrador para regularizar a assinatura.
              </p>
            </div>
          </AppShell>
        );
      }
    }
  }

  const notifications = hasPermission(user.role, "notifications:view")
    ? await listNotificationsForTenant({
        companyId: user.companyId,
        userId: user.id,
        role: user.role,
        query: { page: 1, pageSize: 8 },
      })
    : null;

  return (
    <AppShell
      user={user}
      companyName={displayName}
      pathname={pathname}
      notifications={
        notifications
          ? { unreadCount: notifications.unreadCount, items: notifications.items }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
