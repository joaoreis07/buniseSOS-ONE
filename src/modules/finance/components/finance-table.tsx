import Link from "next/link";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import {
  RECEIVABLE_STATUS_LABELS,
  formatDateBR,
} from "@/modules/finance/lib/finance-labels";
import {
  DataTableShell,
  EmptyState,
  StatCard,
} from "@/shared/components/page-layout";
import { cn } from "@/shared/utilities/cn";

function statusVariant(status: keyof typeof RECEIVABLE_STATUS_LABELS) {
  if (status === "PAID") return "success" as const;
  if (status === "OVERDUE") return "destructive" as const;
  if (status === "CANCELLED") return "secondary" as const;
  return "warning" as const;
}

export function FinanceKpis({
  kpis,
}: {
  kpis: {
    openAmount: unknown;
    overdueAmount: unknown;
    receivedAmount: unknown;
  };
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="A receber (aberto)"
        value={formatMoneyBRL(kpis.openAmount)}
        icon={TrendingUp}
        tone="blue"
      />
      <StatCard
        label="Recebido (mês)"
        value={formatMoneyBRL(kpis.receivedAmount)}
        icon={TrendingUp}
        tone="emerald"
      />
      <StatCard
        label="Vencido"
        value={formatMoneyBRL(kpis.overdueAmount)}
        sub="Atenção necessária"
        icon={AlertCircle}
        tone="rose"
      />
    </div>
  );
}

export function FinanceTable({
  items,
}: {
  items: Array<{
    id: string;
    status: keyof typeof RECEIVABLE_STATUS_LABELS;
    totalAmount: unknown;
    paidAmount: unknown;
    remainingAmount: unknown;
    dueDate: Date | null;
    customer: { id: string; name: string } | null;
    sale: { id: string; number: number; status: string };
  }>;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhuma conta a receber"
        description="Nenhuma parcela encontrada com os filtros selecionados."
      />
    );
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
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
              Vencimento
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">
              Total
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Pago
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Saldo
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((item) => (
            <tr
              key={item.id}
              className={cn(
                "transition-colors hover:bg-slate-50",
                item.status === "OVERDUE" && "bg-red-50/30",
              )}
            >
              <td className="px-5 py-3.5">
                <Link
                  href={`/app/finance/${item.id}`}
                  className="font-mono text-xs font-semibold text-[var(--bos-primary)] hover:underline"
                >
                  {formatSaleNumber(item.sale.number)}
                </Link>
              </td>
              <td className="px-4 py-3.5 text-sm font-medium text-slate-800">
                {item.customer?.name ?? "Sem cliente"}
              </td>
              <td className="hidden px-4 py-3.5 text-center text-xs font-medium text-slate-600 md:table-cell">
                {formatDateBR(item.dueDate)}
              </td>
              <td className="hidden px-4 py-3.5 text-right text-sm text-slate-700 sm:table-cell">
                {formatMoneyBRL(item.totalAmount)}
              </td>
              <td className="hidden px-4 py-3.5 text-right text-sm text-slate-600 lg:table-cell">
                {formatMoneyBRL(item.paidAmount)}
              </td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-800">
                {formatMoneyBRL(item.remainingAmount)}
              </td>
              <td className="px-4 py-3.5 text-center">
                <Badge variant={statusVariant(item.status)}>
                  {RECEIVABLE_STATUS_LABELS[item.status]}
                </Badge>
              </td>
              <td className="px-4 py-3.5 text-center">
                {item.status !== "PAID" && item.status !== "CANCELLED" ? (
                  <Link
                    href={`/app/finance/${item.id}`}
                    className="text-xs font-semibold text-[var(--bos-primary)] hover:underline"
                  >
                    Registrar
                  </Link>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableShell>
  );
}
