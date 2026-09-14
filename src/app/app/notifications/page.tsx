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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">
            {result.unreadCount} não lida{result.unreadCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={query.unread ? "/app/notifications" : "/app/notifications?unread=1"}>
              {query.unread ? "Ver todas" : "Somente não lidas"}
            </Link>
          </Button>
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline">
              Marcar todas como lidas
            </Button>
          </form>
        </div>
      </div>

      {result.items.length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Nenhuma notificação.
        </p>
      ) : (
        <ul className="space-y-2">
          {result.items.map((item) => (
            <li key={item.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className={item.readAt ? "text-muted-foreground" : "font-medium"}>
                    {item.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {NOTIFICATION_TYPE_LABELS[item.type]} · {formatDateTimeBR(item.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!item.readAt ? <Badge>Não lida</Badge> : null}
                  {item.link ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={item.link}>Abrir</Link>
                    </Button>
                  ) : null}
                  {!item.readAt ? (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="notificationId" value={item.id} />
                      <Button type="submit" size="sm" variant="ghost">
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

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          Página {result.page} de {result.pageCount}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/app/notifications?${new URLSearchParams({
                  ...(query.unread ? { unread: "1" } : {}),
                  page: String(result.page - 1),
                }).toString()}`}
              >
                Anterior
              </Link>
            </Button>
          ) : null}
          {result.page < result.pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/app/notifications?${new URLSearchParams({
                  ...(query.unread ? { unread: "1" } : {}),
                  page: String(result.page + 1),
                }).toString()}`}
              >
                Próxima
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
