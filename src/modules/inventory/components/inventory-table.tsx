import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { Product } from "@prisma/client";
import {
  STOCK_LEVEL_LABELS,
  formatMoneyBRL,
  type StockLevel,
} from "@/modules/inventory/lib/inventory-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { StatCard } from "@/shared/components/page-layout";
import { cn } from "@/shared/utilities/cn";

type InventoryRow = {
  product: Product & { category: { id: string; name: string } | null };
  quantity: number;
  minimumQuantity: number;
  stockLevel: StockLevel;
};

function stockVariant(level: StockLevel) {
  if (level === "out") return "destructive" as const;
  if (level === "low") return "secondary" as const;
  return "default" as const;
}

export function InventoryTable({ items }: { items: InventoryRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Nenhum produto físico encontrado com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Produto
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
              SKU
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              Saldo
            </th>
            <th className="hidden px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Mínimo
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Custo médio
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Valor total
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              Situação
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((row) => {
            const isEmpty = row.quantity === 0;
            const isLow = row.stockLevel === "low";
            const totalValue = row.quantity * Number(row.product.costPrice);
            return (
              <tr
                key={row.product.id}
                className="transition-colors hover:bg-slate-50"
              >
                <td className="px-5 py-3.5">
                  <Link
                    href={`/app/inventory/${row.product.id}`}
                    className="font-semibold text-slate-800 hover:text-[var(--bos-primary)]"
                  >
                    {row.product.name}
                  </Link>
                </td>
                <td className="hidden px-4 py-3.5 md:table-cell">
                  <span className="font-mono text-xs text-slate-500">
                    {row.product.sku}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isEmpty
                        ? "text-red-600"
                        : isLow
                          ? "text-amber-600"
                          : "text-slate-800",
                    )}
                  >
                    {row.quantity}
                  </span>
                </td>
                <td className="hidden px-4 py-3.5 text-center text-xs text-slate-400 lg:table-cell">
                  {row.minimumQuantity}
                </td>
                <td className="hidden px-4 py-3.5 text-right text-xs text-slate-500 lg:table-cell">
                  {formatMoneyBRL(row.product.costPrice)}
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
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/app/inventory/${row.product.id}`}>Ver</Link>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function InventorySummaryCards({
  summary,
}: {
  summary: {
    productCount: number;
    withStock: number;
    lowStock: number;
    outOfStock: number;
    totalQuantity: number;
    totalValue: number;
  };
}) {
  const cards = [
    { label: "Produtos físicos", value: summary.productCount, tone: "blue" as const },
    { label: "Com registro de estoque", value: summary.withStock, tone: "slate" as const },
    { label: "Estoque baixo", value: summary.lowStock, tone: "amber" as const },
    { label: "Sem estoque", value: summary.outOfStock, tone: "rose" as const },
    { label: "Quantidade total", value: summary.totalQuantity, tone: "slate" as const },
    {
      label: "Valor (custo)",
      value: formatMoneyBRL(summary.totalValue),
      tone: "emerald" as const,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          tone={card.tone}
        />
      ))}
    </div>
  );
}

export function InventoryHeaderSubtitle({
  summary,
}: {
  summary: {
    totalValue: number;
    lowStock: number;
    outOfStock: number;
  };
}) {
  const alerts = summary.lowStock + summary.outOfStock;
  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <span>
        Valor total em estoque:{" "}
        <strong className="text-slate-700">
          {formatMoneyBRL(summary.totalValue)}
        </strong>
      </span>
      {alerts > 0 ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
          <AlertTriangle className="size-3" aria-hidden />
          {alerts} produto(s) abaixo do mínimo ou sem estoque
        </span>
      ) : null}
    </span>
  );
}
