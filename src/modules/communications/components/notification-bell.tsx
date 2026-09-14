"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/communications/actions/notification.actions";
import { NOTIFICATION_TYPE_LABELS } from "@/modules/communications/lib/labels";
import { formatDateTimeBR } from "@/modules/sales/lib/sale-labels";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

type NotificationItem = {
  id: string;
  type: keyof typeof NOTIFICATION_TYPE_LABELS;
  title: string;
  message: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationBell({
  unreadCount,
  items,
}: {
  unreadCount: number;
  items: NotificationItem[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notificações">
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)]">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notificações</span>
          {unreadCount > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <button type="submit" className="text-xs font-normal text-emerald-700">
                Marcar todas
              </button>
            </form>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nenhuma notificação.
          </p>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="cursor-pointer items-start"
              onSelect={() => {
                const data = new FormData();
                data.set("notificationId", item.id);
                void markNotificationReadAction(data);
                window.location.href = item.link ?? "/app/notifications";
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span className={item.readAt ? "text-muted-foreground" : "font-medium"}>
                  {item.title}
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {item.message}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {NOTIFICATION_TYPE_LABELS[item.type]} · {formatDateTimeBR(item.createdAt)}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/notifications">Ver todas</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
