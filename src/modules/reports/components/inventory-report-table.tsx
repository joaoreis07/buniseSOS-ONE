import Link from "next/link";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import {
  STOCK_LEVEL_LABELS,
  type StockLevel,
} from "@/modules/inventory/lib/inventory-labels";
import { EmptyBlock } from "@/modules/reports/components/kpi-card";
import { Badge } from "@/shared/ui/badge";
import { DataTableShell } from "@/shared/components/page-layout";
import { cn } from "@/shared/utilities/cn";

function stockVariant(level: StockLevel) {
  if (level === "out") return "destructive" as const;
  if (level === "low") return "warning" as const;
  return "success" as const;
}

export function InventoryReportTable({
  items,
}: {
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    costPrice: number;
    quantity: number;
    minimumQuantity: number;
    stockLevel: StockLevel;
  }>;
}) {
  if (items.length === 0) {
    return <EmptyBlock>Nenhum produto encontrado para os filtros.</EmptyBlock>;
  }

  return (
    <DataTableShell>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Produto
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Estoque
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">
              Mínimo
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
              Custo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((row) => (
            <tr
              key={row.productId}
              className={cn(
                "transition-colors hover:bg-slate-50",
                row.stockLevel === "out" && "bg-red-50/20",
              )}
            >
              <td className="px-5 py-3.5">
                <Link
                  href={`/app/inventory/${row.productId}`}
                  className="text-sm font-semibold text-slate-800 hover:text-[var(--bos-primary)] hover:underline"
                >
                  {row.name}
                </Link>
                <div className="text-xs text-slate-400">{row.sku}</div>
              </td>
              <td className="px-4 py-3.5 text-right text-sm font-medium text-slate-700">
                {row.quantity}
              </td>
              <td className="hidden px-4 py-3.5 text-right text-sm text-slate-600 sm:table-cell">
                {row.minimumQuantity}
              </td>
              <td className="px-4 py-3.5 text-center">
                <Badge variant={stockVariant(row.stockLevel)}>
                  {STOCK_LEVEL_LABELS[row.stockLevel]}
                </Badge>
              </td>
              <td className="hidden px-4 py-3.5 text-right text-sm text-slate-600 md:table-cell">
                {formatMoneyBRL(row.costPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}
