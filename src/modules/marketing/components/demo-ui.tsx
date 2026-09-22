"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Bell, Search } from "lucide-react";
import { DEMO_NOTICE, DEMO_PLAN } from "@/modules/marketing/demo-data";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { SectionCard } from "@/shared/components/page-layout";
import { cn } from "@/shared/utilities/cn";

export function DemoNotice({ children }: { children?: string }) {
  return (
    <div className="demo-notice">
      <span className="demo-notice__dot" aria-hidden />
      <p>{children ?? DEMO_NOTICE}</p>
    </div>
  );
}

export function DemoCta() {
  return (
    <SectionCard className="demo-cta overflow-hidden border-0 bg-gradient-to-br from-[#071225] via-[#0b1d3a] to-blue-900 text-white shadow-xl shadow-blue-950/25">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300">
            BusinessOS One
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white">
            Gostou do que viu?
          </h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-slate-300">
            Crie sua empresa e use CRM, vendas, estoque e financeiro no mesmo lugar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="rounded-xl bg-white text-blue-800 hover:bg-blue-50">
            <Link href="/register">
              Começar agora
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/#planos">Ver planos</Link>
          </Button>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        {DEMO_PLAN.name} · {DEMO_PLAN.price}
      </p>
    </SectionCard>
  );
}

export function DemoToolbar({
  placeholder = "Pesquisar…",
  children,
}: {
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <div className="demo-toolbar">
      <div className="demo-toolbar__search">
        <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
        <Input
          placeholder={placeholder}
          className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          readOnly
          aria-label={placeholder}
        />
      </div>
      {children}
    </div>
  );
}

export function DemoSectionTabs({
  items,
  active,
  onChange,
}: {
  items: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="demo-section-tabs" aria-label="Seções do módulo">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn(active === item.id && "is-active")}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export function DemoDetailPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <SectionCard title={title} description={description} className="demo-detail-panel">
      {children}
    </SectionCard>
  );
}

export function DemoNotificationList({
  items,
}: {
  items: Array<{ title: string; detail: string; unread?: boolean }>;
}) {
  return (
    <ul className="demo-notifications">
      {items.map((item) => (
        <li key={item.title} className={cn(item.unread && "is-unread")}>
          <Bell className="size-4 shrink-0 text-blue-600" aria-hidden />
          <div>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
