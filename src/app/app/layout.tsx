import { prisma } from "@/shared/db/prisma";
import { requireSession } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { AppShell } from "@/modules/app-shell/components/app-shell";
import { listNotificationsForTenant } from "@/modules/communications/services/notification.service";
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

  const company = await prisma.company.findFirst({
    where: { id: user.companyId, deletedAt: null },
    select: {
      name: true,
      settings: { select: { displayName: true } },
    },
  });
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
      companyName={company?.settings?.displayName?.trim() || company?.name || "Empresa"}
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
