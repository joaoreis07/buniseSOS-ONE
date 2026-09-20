"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { BrandMark } from "@/shared/brand/brand-logo";
import { DEMO_NOTICE, DEMO_PLAN } from "@/modules/marketing/demo-data";
import { DEMO_NAV, type DemoModuleId } from "@/modules/marketing/demo-nav";
import { DemoScreen } from "@/modules/marketing/components/demo-screens";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { cn } from "@/shared/utilities/cn";

function NavLinks({
  module,
  onNavigate,
  dark = false,
}: {
  module: DemoModuleId;
  onNavigate?: () => void;
  dark?: boolean;
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Módulos da demonstração">
      {DEMO_NAV.map((item) => {
        const Icon = item.icon;
        const active = item.id === module;
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-blue-600 text-white shadow-md shadow-blue-950/25"
                : dark
                  ? "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DemoShell({ module }: { module: DemoModuleId }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-foreground">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-[1600px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2">
              <BrandMark size={32} className="size-8 rounded-none" />
              <span className="font-semibold">BusinessOS One</span>
            </Link>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Abrir menu da demonstração"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col border-0 bg-[#071225] p-0 text-white">
                <SheetHeader className="border-b border-white/10 p-5 text-left">
                  <SheetTitle className="text-white">Demonstração interativa</SheetTitle>
                </SheetHeader>
                <div className="flex-1 p-3">
                  <NavLinks module={module} onNavigate={() => setMenuOpen(false)} dark />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <p className="text-xs font-medium text-blue-700 sm:text-sm">
            Demonstração interativa
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-500">
              {DEMO_PLAN.name} · {DEMO_PLAN.price}
            </span>
            <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-blue-600">
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Começar agora
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <div className="border-b border-blue-100 bg-blue-50 px-4 py-2 text-center text-sm text-blue-900">
        Você está visualizando dados de demonstração. {DEMO_NOTICE}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 bg-[#071225] text-white md:flex md:flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <p className="text-sm font-semibold">Empresa exemplo</p>
            <p className="text-xs text-slate-400">Somente visualização</p>
          </div>
          <div className="flex-1 p-3">
            <NavLinks module={module} dark />
          </div>
          <div className="border-t border-white/10 p-5">
            <Link href="/sobre" className="text-xs text-slate-400 hover:text-white">
              Preço, FAQ e benefícios
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-9">
          <nav
            className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden"
            aria-label="Módulos da demonstração (mobile)"
          >
            {DEMO_NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium",
                  item.id === module
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-500",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mx-auto w-full max-w-7xl">
            <DemoScreen module={module} />
          </div>
          <p className="mt-8 text-center">
            <Link
              href="/register"
              className="text-sm font-semibold text-[#2563EB] hover:underline"
            >
              Quero usar o BusinessOS One
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
