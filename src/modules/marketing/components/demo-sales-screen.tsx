"use client";

import { useState } from "react";
import { CircleDollarSign, Plus, Search, ShoppingCart, TrendingUp } from "lucide-react";
import { DEMO_SALES } from "@/modules/marketing/demo-data";
import { ModulePageHeader, PageContainer, StatCard } from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("conclu") || normalized.includes("pago")) {
    return <Badge variant="default">{status}</Badge>;
  }
  if (normalized.includes("pend") || normalized.includes("rascunho")) {
    return <Badge variant="secondary">{status}</Badge>;
  }
  if (normalized.includes("cancel")) {
    return <Badge variant="destructive">{status}</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "concluida", label: "Concluída" },
  { value: "pendente", label: "Pendente" },
  { value: "rascunho", label: "Rascunho" },
];

export function DemoSalesScreen() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = DEMO_SALES.filter((sale) => {
    const matchSearch =
      sale.customer.toLowerCase().includes(search.toLowerCase()) ||
      sale.number.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      !status || sale.status.toLowerCase().includes(status.replace("concluida", "conclu"));
    return matchSearch && matchStatus;
  });

  return (
    <PageContainer>
      <ModulePageHeader
        title="Vendas"
        subtitle="24 / 30 vendas este mês (plano Free)"
        actions={
          <Button type="button" disabled size="sm">
            <Plus className="mr-1.5 size-3.5" aria-hidden />
            Nova venda
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total vendas" value={24} icon={ShoppingCart} tone="blue" />
          <StatCard label="Total recebido" value="R$ 24.580,00" icon={TrendingUp} tone="green" />
          <StatCard label="Aguardando pagamento" value="R$ 197,00" icon={CircleDollarSign} tone="amber" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Vendas hoje" value={3} tone="slate" />
          <StatCard label="Faturamento hoje" value="R$ 1.890,00" tone="slate" />
          <StatCard label="Ticket médio hoje" value="R$ 630,00" tone="slate" />
          <StatCard label="Ticket médio no mês" value="R$ 167,21" tone="slate" />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número ou cliente…"
            className="h-9 w-full pl-9 sm:w-72"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold capitalize transition-all ${
                status === opt.value
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Nº Venda</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Cliente</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">Data</th>
              <th className="hidden px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">Itens</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Total</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">Pagamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((sale) => (
              <tr key={sale.id} className="cursor-default transition-colors hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <span className="font-mono text-xs font-semibold text-[var(--bos-primary)]">{sale.number}</span>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800">{sale.customer}</td>
                <td className="hidden px-4 py-3.5 text-xs text-slate-400 md:table-cell">22/09/2026</td>
                <td className="hidden px-4 py-3.5 text-center text-xs text-slate-500 lg:table-cell">1</td>
                <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-800">{sale.total}</td>
                <td className="px-4 py-3.5 text-center">{statusBadge(sale.status)}</td>
                <td className="hidden px-4 py-3.5 text-xs text-slate-500 lg:table-cell">{sale.payment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
