import Link from "next/link";
import {
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
  formatMoneyBRL,
} from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import { formatDateBR } from "@/modules/finance/lib/finance-labels";
import { EmptyBlock } from "@/modules/reports/components/kpi-card";
import { Badge } from "@/shared/ui/badge";
import { DataTableShell } from "@/shared/components/page-layout";
import { cn } from "@/shared/utilities/cn";

function statusVariant(status: keyof typeof SALE_STATUS_LABELS) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "CANCELLED") return "destructive" as const;
  return "secondary" as const;
}

export function SalesReportTable({
  items,
}: {
  items: Array<{
    id: string;
    number: number;
    status: keyof typeof SALE_STATUS_LABELS;
    paymentMethod: keyof typeof PAYMENT_METHOD_LABELS;
    subtotal: number;
    discountAmount: number;
    total: number;
    completedAt: Date | null;
    cancelledAt: Date | null;
    customerName: string | null;
    sellerName: string;
    itemCount: number;
    itemQuantity: number;
  }>;
}) {
  if (items.length === 0) {
    return <EmptyBlock>Nenhuma venda no período selecionado.</EmptyBlock>;
  }

  return (
    <DataTableShell>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Venda
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Data
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cliente
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Itens
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
              Subtotal
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
              Descontos
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "transition-colors hover:bg-slate-50",
                row.status === "CANCELLED" && "bg-red-50/20",
              )}
            >
              <td className="px-5 py-3.5">
                <Link
                  href={`/app/sales/${row.id}`}
                  className="font-mono text-xs font-semibold text-[var(--bos-primary)] hover:underline"
                >
                  {formatSaleNumber(row.number)}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant={statusVariant(row.status)}>
                    {SALE_STATUS_LABELS[row.status]}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {PAYMENT_METHOD_LABELS[row.paymentMethod]}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-xs font-medium text-slate-600">
                {formatDateBR(row.completedAt ?? row.cancelledAt)}
              </td>
              <td className="px-4 py-3.5">
                <div className="text-sm font-medium text-slate-800">
                  {row.customerName ?? "—"}
                </div>
                <div className="text-xs text-slate-400">{row.sellerName}</div>
              </td>
              <td className="hidden px-4 py-3.5 text-xs text-slate-500 lg:table-cell">
                {row.itemCount} · {row.itemQuantity} un.
              </td>
              <td className="hidden px-4 py-3.5 text-right text-sm text-slate-600 md:table-cell">
                {formatMoneyBRL(row.subtotal)}
              </td>
              <td className="hidden px-4 py-3.5 text-right text-sm text-slate-600 md:table-cell">
                {formatMoneyBRL(row.discountAmount)}
              </td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-800">
                {formatMoneyBRL(row.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}
