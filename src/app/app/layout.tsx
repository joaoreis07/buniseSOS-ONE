import { prisma } from "@/shared/db/prisma";
import { requireSession } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { AppShell } from "@/modules/app-shell/components/app-shell";
import { listNotificationsForTenant } from "@/modules/communications/services/notification.service";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();
  const company = await prisma.company.findFirst({
    where: { id: user.companyId, deletedAt: null },
    select: { name: true },
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
      companyName={company?.name ?? "Empresa"}
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
