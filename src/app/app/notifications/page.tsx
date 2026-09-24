import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { notificationListQuerySchema } from "@/modules/communications/schemas/communication.schemas";
import { listNotificationsForTenant } from "@/modules/communications/services/notification.service";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/communications/actions/notification.actions";
import { NOTIFICATION_TYPE_LABELS } from "@/modules/communications/lib/labels";
import { formatDateTimeBR } from "@/modules/sales/lib/sale-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  EmptyState,
  ModulePageHeader,
  PageContainer,
  PaginationBar,
} from "@/shared/components/page-layout";
import { Bell } from "lucide-react";
import { cn } from "@/shared/utilities/cn";

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("notifications:view");
  const raw = await searchParams;
  const parsed = notificationListQuerySchema.safeParse({
    unread: first(raw.unread),
    page: first(raw.page) ?? "1",
    pageSize: first(raw.pageSize) ?? "20",
  });
  const query = parsed.success
    ? parsed.data
    : notificationListQuerySchema.parse({ page: 1, pageSize: 20 });
  const result = await listNotificationsForTenant({
    companyId: user.companyId,
    userId: user.id,
    role: user.role,
    query,
  });

  const queryBase = query.unread ? "?unread=1" : "";

  return (
    <PageContainer>
      <ModulePageHeader
        title="Notificações"
        subtitle={`${result.unreadCount} não lida${result.unreadCount === 1 ? "" : "s"}`}
        actions={
          <>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={query.unread ? "/app/notifications" : "/app/notifications?unread=1"}>
                {query.unread ? "Ver todas" : "Somente não lidas"}
              </Link>
            </Button>
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="outline" className="rounded-xl">
                Marcar todas como lidas
              </Button>
            </form>
          </>
        }
      />

      {result.items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nenhuma notificação"
          description="Quando houver alertas ou avisos, eles aparecerão aqui."
        />
      ) : (
        <ul className="divide-y divide-slate-50 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {result.items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "px-5 py-4 transition-colors hover:bg-slate-50/50",
                !item.readAt && "bg-blue-50/30",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm",
                      item.readAt ? "text-slate-500" : "font-semibold text-slate-800",
                    )}
                  >
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {NOTIFICATION_TYPE_LABELS[item.type]} · {formatDateTimeBR(item.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {!item.readAt ? (
                    <Badge className="rounded-md bg-[var(--bos-primary)]/10 text-[var(--bos-primary)]">
                      Não lida
                    </Badge>
                  ) : null}
                  {item.link ? (
                    <Button asChild size="sm" variant="outline" className="rounded-lg">
                      <Link href={item.link}>Abrir</Link>
                    </Button>
                  ) : null}
                  {!item.readAt ? (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="notificationId" value={item.id} />
                      <Button type="submit" size="sm" variant="ghost" className="text-xs">
                        Marcar lida
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {result.items.length > 0 ? (
        <PaginationBar
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          totalLabel="notificações"
          prevHref={
            result.page > 1
              ? `/app/notifications${queryBase}${queryBase ? "&" : "?"}page=${result.page - 1}`
              : undefined
          }
          nextHref={
            result.page < result.pageCount
              ? `/app/notifications${queryBase}${queryBase ? "&" : "?"}page=${result.page + 1}`
              : undefined
          }
        />
      ) : null}
    </PageContainer>
  );
}
