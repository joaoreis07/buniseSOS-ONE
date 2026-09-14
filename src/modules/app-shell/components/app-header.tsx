"use client";

import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/modules/auth/actions/auth.actions";
import { can } from "@/shared/permissions/can";
import { APP_NAV_ITEMS } from "@/modules/app-shell/nav";
import { NotificationBell } from "@/modules/communications/components/notification-bell";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";

type NotificationItem = {
  id: string;
  type:
    | "LOW_STOCK"
    | "OUT_OF_STOCK"
    | "OVERDUE_RECEIVABLE"
    | "PAYMENT_RECEIVED"
    | "SALE_COMPLETED"
    | "PURCHASE_RECEIVED"
    | "TASK_ASSIGNED"
    | "SYSTEM";
  title: string;
  message: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

type AppHeaderProps = {
  userName: string | null;
  userEmail: string | null;
  role: Role;
  initials: string;
  notifications?: {
    unreadCount: number;
    items: NotificationItem[];
  } | null;
};

export function AppHeader({
  userName,
  userEmail,
  role,
  initials,
  notifications,
}: AppHeaderProps) {
  const items = APP_NAV_ITEMS.filter((item) => can(role, item.permission));

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 print:hidden">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b px-4 py-4 text-left">
              <SheetTitle>BusinessOS One</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-3">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="size-4" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <p className="text-sm font-medium md:hidden">BusinessOS One</p>
      </div>

      <div className="flex items-center gap-3">
        {notifications ? (
          <NotificationBell
            unreadCount={notifications.unreadCount}
            items={notifications.items}
          />
        ) : null}
        <Badge variant="secondary">{role}</Badge>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-none">
            {userName ?? "Usuário"}
          </p>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <Avatar className="size-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="icon" title="Sair">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
