"use client";

import { LogOut, Menu } from "lucide-react";
import type { ReactNode } from "react";
import type { NotificationType, Role } from "@prisma/client";
import { logoutAction } from "@/modules/auth/actions/auth.actions";
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
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

type AppHeaderProps = {
  userName: string | null;
  userEmail: string | null;
  companyName: string;
  role: Role;
  initials: string;
  pageTitle: string;
  dateLabel: string;
  mobileNav: ReactNode;
  notifications?: {
    unreadCount: number;
    items: NotificationItem[];
  } | null;
};

export function AppHeader({
  userName,
  userEmail,
  companyName,
  role,
  initials,
  pageTitle,
  dateLabel,
  mobileNav,
  notifications,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-9">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 rounded-xl lg:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col border-0 bg-[#071225] p-0 text-white">
              <SheetHeader className="border-b border-white/10 px-5 py-5 text-left">
                <SheetTitle className="text-white">BusinessOS One</SheetTitle>
                <p className="truncate text-xs text-slate-400">{companyName}</p>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">{mobileNav}</div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">
              BusinessOS One
            </p>
            <p className="truncate text-lg font-semibold tracking-[-0.03em] text-slate-950">
              {pageTitle}
            </p>
            <p className="hidden text-xs capitalize text-slate-400 sm:block">{dateLabel}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {notifications ? (
            <NotificationBell
              unreadCount={notifications.unreadCount}
              items={notifications.items}
            />
          ) : null}
          <Badge variant="secondary" className="hidden rounded-lg bg-blue-50 text-blue-700 sm:inline-flex">
            {role}
          </Badge>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-none text-slate-800">
              {userName ?? "Usuário"}
            </p>
            <p className="mt-1 max-w-44 truncate text-xs text-slate-400">{userEmail}</p>
          </div>
          <Avatar className="size-9 ring-2 ring-blue-100">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="icon" title="Sair" className="text-slate-400">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
