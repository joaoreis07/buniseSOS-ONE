"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, Menu } from "lucide-react";
import { BrandMark } from "@/shared/brand/brand-logo";
import { DEMO_COMMUNICATIONS, DEMO_NOTICE, DEMO_PLAN } from "@/modules/marketing/demo-data";
import {
  DEMO_NAV,
  DEMO_NAV_GROUPS,
  demoModuleLabel,
  type DemoModuleId,
} from "@/modules/marketing/demo-nav";
import { DemoScreen } from "@/modules/marketing/components/demo-screens";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { cn } from "@/shared/utilities/cn";

function NavLinks({
  module,
  onNavigate,
}: {
  module: DemoModuleId;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-5" aria-label="Módulos da demonstração">
      {DEMO_NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.id === module;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-950/30"
                      : "text-slate-300 hover:bg-white/[0.07] hover:text-white",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "size-[18px] shrink-0",
                      active ? "text-blue-100" : "text-slate-500 group-hover:text-blue-300",
                    )}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function DemoTopbar({
  module,
  onOpenMenu,
}: {
  module: DemoModuleId;
  onOpenMenu: () => void;
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const title = demoModuleLabel(module);
  const date = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date());
  const notificationItems = DEMO_COMMUNICATIONS.filter((item) => item.id === "demo-comm-3");

  return (
    <header className="demo-topbar sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-9">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl lg:hidden"
            aria-label="Abrir menu da demonstração"
            onClick={onOpenMenu}
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">
              Demonstração
            </p>
            <p className="truncate text-lg font-semibold tracking-[-0.03em] text-slate-950">
              {title}
            </p>
            <p className="hidden text-xs capitalize text-slate-400 sm:block">{date}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                "relative rounded-xl",
                notificationsOpen && "border-blue-200 bg-blue-50",
              )}
              aria-label="Notificações da demonstração"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((open) => !open)}
            >
              <Bell className="size-4" />
              <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                1
              </span>
            </Button>
            {notificationsOpen ? (
              <div className="demo-popover">
                <div className="demo-popover__header">
                  <strong>Notificações</strong>
                  <Link href="/demo/communications" onClick={() => setNotificationsOpen(false)}>
                    Ver central
                  </Link>
                </div>
                <ul>
                  {notificationItems.map((item) => (
                    <li key={item.id}>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </li>
                  ))}
                </ul>
                <p className="demo-popover__foot">{DEMO_NOTICE}</p>
              </div>
            ) : null}
          </div>

          <Badge
            variant="secondary"
            className="hidden rounded-lg bg-blue-50 text-blue-700 sm:inline-flex"
          >
            ADMIN
          </Badge>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-none text-slate-800">João Silva</p>
            <p className="mt-1 text-xs text-slate-400">demo@empresa.com.br</p>
          </div>
          <Avatar className="size-9 ring-2 ring-blue-100">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-semibold text-white">
              JS
            </AvatarFallback>
          </Avatar>
          <Button asChild className="hidden rounded-xl shadow-sm shadow-blue-900/15 sm:inline-flex">
            <Link href="/register">
              Começar agora
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function DemoShell({ module }: { module: DemoModuleId }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="demo-shell min-h-screen bg-[hsl(210_40%_98%)] text-foreground">
      <div className="demo-shell__banner">
        Você está visualizando dados de demonstração. {DEMO_NOTICE}
      </div>

      <div className="lg:pl-64">
        <aside className="demo-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#071225] text-white shadow-xl lg:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <Link href="/" aria-label="BusinessOS One — demonstração">
              <span className="flex items-center gap-3">
                <BrandMark size={40} className="size-10 ring-1 ring-white/15" />
                <span>
                  <span className="block font-semibold tracking-[-0.02em] text-white">
                    BusinessOS One
                  </span>
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-blue-300">
                    Gestão integrada
                  </span>
                </span>
              </span>
            </Link>
            <p className="mt-3 truncate rounded-xl bg-white/[0.06] px-3 py-2 text-xs text-slate-300">
              Empresa Exemplo · somente visualização
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-5">
            <NavLinks module={module} />
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-4 shadow-lg shadow-blue-950/40">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100">
                Plano completo
              </p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white">
                {DEMO_PLAN.price}
              </p>
              <Link
                href="/register"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-50"
              >
                Criar conta
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <Link
              href="/#planos"
              className="mt-3 block text-center text-xs text-slate-400 hover:text-white"
            >
              Preço, FAQ e benefícios
            </Link>
          </div>
        </aside>

        <DemoTopbar module={module} onOpenMenu={() => setMenuOpen(true)} />

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent
            side="left"
            className="flex w-72 flex-col border-0 bg-[#071225] p-0 text-white lg:hidden"
          >
            <SheetHeader className="border-b border-white/10 p-5 text-left">
              <SheetTitle className="text-white">Demonstração interativa</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <NavLinks module={module} onNavigate={() => setMenuOpen(false)} />
            </div>
            <div className="border-t border-white/10 p-4">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                Começar agora
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </SheetContent>
        </Sheet>

        <main className="demo-main app-surface relative min-w-0 px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
          <div className="demo-main__glow" aria-hidden />
          <nav
            className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden"
            aria-label="Módulos da demonstração (mobile)"
          >
            {DEMO_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition",
                  item.id === module
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-700",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="relative mx-auto w-full max-w-7xl">
            <DemoScreen module={module} />
          </div>
        </main>
      </div>
    </div>
  );
}
