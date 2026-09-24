"use client";

import type { ReactNode } from "react";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import type { ShellUser } from "@/modules/product-shell/types";

type ProductTopbarProps = {
  isDemo?: boolean;
  user: ShellUser;
  mobileNav?: ReactNode;
  notificationsSlot?: ReactNode;
};

export function ProductTopbar({
  isDemo,
  user,
  mobileNav,
  notificationsSlot,
}: ProductTopbarProps) {
  return (
    <header
      className="fixed top-0 right-0 z-40 flex items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:left-[var(--bos-sidebar-width)]"
      style={{ height: "var(--bos-topbar-height)" }}
    >
      {mobileNav ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[var(--bos-sidebar-width)] border-0 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            {mobileNav}
          </SheetContent>
        </Sheet>
      ) : null}

      <div className="max-w-md flex-1">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            disabled
            aria-disabled="true"
            placeholder="Buscar clientes, vendas, produtos..."
            title="Busca global em breve"
            className="h-8 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-400 placeholder:text-slate-400"
          />
        </div>
      </div>

      {isDemo ? (
        <div className="hidden items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 sm:flex">
          <span className="size-1.5 animate-pulse rounded-full bg-amber-500" aria-hidden />
          <span className="text-xs font-medium text-amber-700">Dados de demonstração</span>
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        {notificationsSlot ?? (
          <button
            type="button"
            className="relative flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
            aria-label="Notificações"
          >
            <Bell className="size-4" />
          </button>
        )}
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
        >
          <div
            className="flex size-7 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: "var(--bos-primary)" }}
          >
            {user.initials.charAt(0)}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-xs font-semibold leading-tight text-slate-800">{user.name}</p>
            <p className="text-[10px] text-slate-400">{user.roleLabel}</p>
          </div>
          <ChevronDown className="hidden size-3 text-slate-400 md:block" aria-hidden />
        </button>
      </div>
    </header>
  );
}
