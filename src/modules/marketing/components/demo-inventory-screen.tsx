"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  DEMO_INVENTORY_ROWS,
  DEMO_INVENTORY_SUMMARY,
} from "@/modules/marketing/demo-data";
import {
  InventoryHeaderSubtitle,
  InventorySummaryCards,
} from "@/modules/inventory/components/inventory-table";
import {
  STOCK_LEVEL_LABELS,
  formatMoneyBRL,
  type StockLevel,
} from "@/modules/inventory/lib/inventory-labels";
import { ModulePageHeader, PageContainer, PaginationBar } from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/utilities/cn";

const STOCK_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "low", label: "Estoque baixo" },
  { value: "out", label: "Sem estoque" },
];

function stockVariant(level: StockLevel) {
  if (level === "out") return "destructive" as const;
  if (level === "low") return "secondary" as const;
  return "default" as const;
}

export function DemoInventoryScreen() {
  const [search, setSearch] = useState("");
  const [stock, setStock] = useState("");

  const filtered = DEMO_INVENTORY_ROWS.filter((row) => {
    const matchSearch =
      row.name.toLowerCase().includes(search.toLowerCase()) ||
      row.sku.toLowerCase().includes(search.toLowerCase());
    const matchStock = !stock || row.stockLevel === stock;
    return matchSearch && matchStock;
  });

  return (
    <PageContainer>
      <ModulePageHeader
        title="Estoque"
        subtitle={<InventoryHeaderSubtitle summary={DEMO_INVENTORY_SUMMARY} />}
      />

      <InventorySummaryCards summary={DEMO_INVENTORY_SUMMARY} />

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
              placeholder="Buscar produto ou SKU…"
              className="h-9 w-full pl-9 sm:w-64"
            />
          </div>
          <div className="flex shrink-0 gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
            {STOCK_OPTIONS.map((option) => (
              <button
                key={option.value || "all"}
                type="button"
                onClick={() => setStock(option.value)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition-all",
                  stock === option.value
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
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Produto</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">SKU</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Saldo</th>
              <th className="hidden px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">Mínimo</th>
              <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">Custo médio</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Valor total</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Situação</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((row) => {
              const isEmpty = row.quantity === 0;
              const isLow = row.stockLevel === "low";
              const totalValue = row.quantity * row.costPrice;
              return (
                <tr key={row.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{row.name}</td>
                  <td className="hidden px-4 py-3.5 md:table-cell">
                    <span className="font-mono text-xs text-slate-500">{row.sku}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        isEmpty ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-800",
                      )}
                    >
                      {row.quantity}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3.5 text-center text-xs text-slate-400 lg:table-cell">
                    {row.minimumQuantity}
                  </td>
                  <td className="hidden px-4 py-3.5 text-right text-xs text-slate-500 lg:table-cell">
                    {formatMoneyBRL(row.costPrice)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-700">
                    {formatMoneyBRL(totalValue)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge variant={stockVariant(row.stockLevel)}>
                      {STOCK_LEVEL_LABELS[row.stockLevel]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button type="button" size="sm" variant="outline" disabled>
                      Ver
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={1}
        pageCount={1}
        total={filtered.length}
        totalLabel="item(ns)"
      />
    </PageContainer>
  );
}
