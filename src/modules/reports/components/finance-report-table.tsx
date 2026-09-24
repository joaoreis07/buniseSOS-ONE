import Link from "next/link";
import { PAYMENT_METHOD_LABELS, formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import {
  RECEIVABLE_STATUS_LABELS,
  formatDateBR,
} from "@/modules/finance/lib/finance-labels";
import { EmptyBlock } from "@/modules/reports/components/kpi-card";
import { Badge } from "@/shared/ui/badge";
import { DataTableShell } from "@/shared/components/page-layout";
import { cn } from "@/shared/utilities/cn";

function statusVariant(
  status: keyof typeof RECEIVABLE_STATUS_LABELS,
  overdue: boolean,
) {
  if (status === "PAID") return "success" as const;
  if (overdue || status === "OVERDUE") return "destructive" as const;
  if (status === "CANCELLED") return "secondary" as const;
  return "warning" as const;
}

export function FinanceReportTable({
  items,
}: {
  items: Array<{
    id: string;
    status: keyof typeof RECEIVABLE_STATUS_LABELS;
    paymentMethod: keyof typeof PAYMENT_METHOD_LABELS;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: Date | null;
    overdue: boolean;
    customerName: string | null;
    saleId: string;
    saleNumber: number;
  }>;
}) {
  if (items.length === 0) {
    return <EmptyBlock>Nenhuma conta a receber no período selecionado.</EmptyBlock>;
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
              Cliente
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Vencimento
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">
              Original
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
              Recebido
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Saldo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "transition-colors hover:bg-slate-50",
                row.overdue && "bg-red-50/30",
              )}
            >
              <td className="px-5 py-3.5">
                <Link
                  href={`/app/finance/${row.id}`}
                  className="font-mono text-xs font-semibold text-[var(--bos-primary)] hover:underline"
                >
                  {formatSaleNumber(row.saleNumber)}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant={statusVariant(row.status, row.overdue)}>
                    {RECEIVABLE_STATUS_LABELS[row.status]}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {PAYMENT_METHOD_LABELS[row.paymentMethod]}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-sm font-medium text-slate-800">
                {row.customerName ?? "—"}
              </td>
              <td className="px-4 py-3.5 text-xs font-medium text-slate-600">
                {formatDateBR(row.dueDate)}
                {row.overdue ? (
                  <div className="text-xs font-semibold text-red-600">Vencido</div>
                ) : null}
              </td>
              <td className="hidden px-4 py-3.5 text-right text-sm text-slate-600 sm:table-cell">
                {formatMoneyBRL(row.totalAmount)}
              </td>
              <td className="hidden px-4 py-3.5 text-right text-sm text-slate-600 md:table-cell">
                {formatMoneyBRL(row.paidAmount)}
              </td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-800">
                {formatMoneyBRL(row.remainingAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}
