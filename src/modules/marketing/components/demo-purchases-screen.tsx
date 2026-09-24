"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  DEMO_PURCHASES,
  DEMO_PURCHASE_KPIS,
} from "@/modules/marketing/demo-data";
import { PurchaseKpis } from "@/modules/purchases/components/purchases-table";
import {
  PURCHASE_STATUS_LABELS,
  formatPurchaseNumber,
} from "@/modules/purchases/lib/purchase-labels";
import type { PurchaseStatus } from "@prisma/client";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { ModulePageHeader, PageContainer, PaginationBar } from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/utilities/cn";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  ...Object.entries(PURCHASE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

function statusVariant(status: PurchaseStatus) {
  if (status === "RECEIVED") return "default" as const;
  if (status === "CANCELLED") return "destructive" as const;
  return "secondary" as const;
}

export function DemoPurchasesScreen() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = DEMO_PURCHASES.filter((purchase) => {
    const matchSearch =
      purchase.supplier.toLowerCase().includes(search.toLowerCase()) ||
      String(purchase.number).includes(search);
    const matchStatus = !status || purchase.status === status;
    return matchSearch && matchStatus;
  });

  const subtitle = (
    <>
      Total no período:{" "}
      <strong className="text-slate-700">{formatMoneyBRL(DEMO_PURCHASE_KPIS.monthValue)}</strong>
      {" · "}
      12 / 20 compras/mês (plano Free)
    </>
  );

  return (
    <PageContainer>
      <ModulePageHeader
        title="Compras"
        subtitle={subtitle}
        actions={
          <Button type="button" disabled size="sm">
            <Plus className="size-3.5" aria-hidden />
            Nova compra
          </Button>
        }
      />

      <PurchaseKpis kpis={DEMO_PURCHASE_KPIS} />

      <form className="space-y-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por fornecedor ou número…"
              className="h-9 w-full pl-9 sm:w-72"
            />
          </div>
          <div className="flex shrink-0 gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value || "all"}
                type="button"
                onClick={() => setStatus(option.value)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition-all",
                  status === option.value
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Nº Compra</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Fornecedor</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">Data</th>
              <th className="hidden px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">Itens</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Total</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">Responsável</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((purchase) => (
              <tr key={purchase.id} className="transition-colors hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <span className="font-mono text-xs font-semibold text-[var(--bos-primary)]">
                    {formatPurchaseNumber(purchase.number)}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800">{purchase.supplier}</td>
                <td className="hidden px-4 py-3.5 text-xs text-slate-400 md:table-cell">{purchase.purchasedAt}</td>
                <td className="hidden px-4 py-3.5 text-center text-xs text-slate-500 lg:table-cell">{purchase.itemCount}</td>
                <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-800">
                  {formatMoneyBRL(purchase.total)}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <Badge variant={statusVariant(purchase.status)}>
                    {PURCHASE_STATUS_LABELS[purchase.status]}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3.5 text-xs text-slate-500 lg:table-cell">{purchase.createdBy}</td>
                <td className="px-4 py-3.5 text-right">
                  <Button type="button" size="sm" variant="outline" disabled>
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={1}
        pageCount={1}
        total={filtered.length}
        totalLabel="compra(s)"
      />
    </PageContainer>
  );
}
