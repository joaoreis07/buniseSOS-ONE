import Link from "next/link";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import {
  PURCHASE_STATUS_LABELS,
  formatPurchaseNumber,
} from "@/modules/purchases/lib/purchase-labels";
import { EmptyBlock } from "@/modules/reports/components/kpi-card";
import { Badge } from "@/shared/ui/badge";
import { DataTableShell } from "@/shared/components/page-layout";
import { cn } from "@/shared/utilities/cn";

function statusVariant(status: keyof typeof PURCHASE_STATUS_LABELS) {
  if (status === "RECEIVED") return "success" as const;
  if (status === "CANCELLED") return "destructive" as const;
  return "warning" as const;
}

export function PurchasesReportTable({
  items,
}: {
  items: Array<{
    purchaseId: string;
    number: number;
    status: keyof typeof PURCHASE_STATUS_LABELS;
    supplierName: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitCost: number;
    lineTotal: number;
    purchaseTotal: number;
  }>;
}) {
  if (items.length === 0) {
    return <EmptyBlock>Nenhuma compra no período selecionado.</EmptyBlock>;
  }

  return (
    <DataTableShell>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Compra
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fornecedor
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Produto
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">
              Qtd.
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
              Custo
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((row, index) => (
            <tr
              key={`${row.purchaseId}-${row.productSku}-${index}`}
              className={cn(
                "transition-colors hover:bg-slate-50",
                row.status === "CANCELLED" && "bg-red-50/20",
              )}
            >
              <td className="px-5 py-3.5">
                <Link
                  href={`/app/purchases/${row.purchaseId}`}
                  className="font-mono text-xs font-semibold text-[var(--bos-primary)] hover:underline"
                >
                  {formatPurchaseNumber(row.number)}
                </Link>
                <div className="mt-1">
                  <Badge variant={statusVariant(row.status)}>
                    {PURCHASE_STATUS_LABELS[row.status]}
                  </Badge>
                </div>
              </td>
              <td className="px-4 py-3.5 text-sm font-medium text-slate-800">
                {row.supplierName}
              </td>
              <td className="px-4 py-3.5">
                <div className="text-sm text-slate-800">{row.productName}</div>
                <div className="text-xs text-slate-400">{row.productSku}</div>
              </td>
              <td className="hidden px-4 py-3.5 text-right text-sm text-slate-600 sm:table-cell">
                {row.quantity}
              </td>
              <td className="hidden px-4 py-3.5 text-right text-sm text-slate-600 md:table-cell">
                {formatMoneyBRL(row.unitCost)}
              </td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-800">
                {formatMoneyBRL(row.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}
