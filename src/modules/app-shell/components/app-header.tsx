"use client";

import { LogOut, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import type { NotificationType, Role } from "@prisma/client";
import { logoutAction } from "@/modules/auth/actions/auth.actions";
import { APP_NAV_ITEMS } from "@/modules/app-shell/nav";
import { NotificationBell } from "@/modules/communications/components/notification-bell";
import { BrandMark } from "@/shared/brand/brand-logo";
import { SidebarNavigation } from "@/modules/app-shell/components/app-sidebar";
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
  const pathname = usePathname();
  const currentItem = [...APP_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) =>
      item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href),
    );
  const date = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur print:hidden sm:px-6 lg:px-9">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col border-0 bg-[#071225] p-0 text-white">
            <SheetHeader className="border-b border-white/10 px-5 py-5 text-left">
              <SheetTitle className="flex items-center gap-2">
                <BrandMark size={32} className="size-8" />
                <span className="text-white">BusinessOS One</span>
              </SheetTitle>
            </SheetHeader>
            <SidebarNavigation role={role} />
          </SheetContent>
        </Sheet>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold tracking-[-0.02em] text-slate-900">
            {currentItem?.title ?? "BusinessOS One"}
          </p>
          <p className="mt-0.5 text-xs capitalize text-slate-400">{date}</p>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <BrandMark size={28} className="size-7" />
          <p className="text-sm font-semibold">BusinessOS One</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
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
          <AvatarFallback className="bg-blue-600 text-xs font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="icon" title="Sair" className="text-slate-400">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
