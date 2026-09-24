import Link from "next/link";
import type { PaymentMethod, Sale, SaleStatus } from "@prisma/client";
import { CircleDollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import {
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
  formatDateTimeBR,
  formatMoneyBRL,
} from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState, StatCard } from "@/shared/components/page-layout";
type SaleRow = Sale & {
  customer: { id: string; name: string } | null;
  seller: { id: string; name: string | null; email: string } | null;
  _count: { items: number };
};

function statusVariant(status: SaleStatus) {
  if (status === "COMPLETED") return "default" as const;
  if (status === "CANCELLED") return "destructive" as const;
  return "secondary" as const;
}

export function SalesTable({ items }: { items: SaleRow[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhuma venda encontrada"
        description="Ajuste os filtros ou registre a primeira venda da empresa."
        action={
          <Button asChild>
            <Link href="/app/sales/new">Registrar venda</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Nº Venda
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cliente
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
              Data
            </th>
            <th className="hidden px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Itens
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Pagamento
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((sale) => (
            <tr
              key={sale.id}
              className="cursor-pointer transition-colors hover:bg-slate-50"
            >
              <td className="px-5 py-3.5">
                <Link
                  href={`/app/sales/${sale.id}`}
                  className="font-mono text-xs font-semibold text-[var(--bos-primary)]"
                >
                  {formatSaleNumber(sale.number)}
                </Link>
              </td>
              <td className="px-4 py-3.5">
                <Link
                  href={`/app/sales/${sale.id}`}
                  className="font-medium text-slate-800"
                >
                  {sale.customer?.name ?? "Sem cliente"}
                </Link>
                <div className="text-xs text-slate-400 lg:hidden">
                  {PAYMENT_METHOD_LABELS[sale.paymentMethod as PaymentMethod]}
                </div>
              </td>
              <td className="hidden px-4 py-3.5 text-xs text-slate-400 md:table-cell">
                {formatDateTimeBR(sale.completedAt ?? sale.createdAt)}
              </td>
              <td className="hidden px-4 py-3.5 text-center text-xs text-slate-500 lg:table-cell">
                {sale._count.items}
              </td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-800">
                {formatMoneyBRL(sale.total)}
              </td>
              <td className="px-4 py-3.5 text-center">
                <Badge variant={statusVariant(sale.status)}>
                  {SALE_STATUS_LABELS[sale.status]}
                </Badge>
              </td>
              <td className="hidden px-4 py-3.5 text-xs text-slate-500 lg:table-cell">
                {PAYMENT_METHOD_LABELS[sale.paymentMethod as PaymentMethod]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SalesKpis({
  kpis,
}: {
  kpis: {
    todayCount: number;
    todayRevenue: number;
    monthCount: number;
    monthRevenue: number;
    todayTicket: number;
    monthTicket: number;
    pendingAmount?: number;
  };
}) {
  const pending = kpis.pendingAmount ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total vendas"
          value={kpis.monthCount}
          icon={ShoppingCart}
          tone="blue"
        />
        <StatCard
          label="Total recebido"
          value={formatMoneyBRL(kpis.monthRevenue)}
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          label="Aguardando pagamento"
          value={formatMoneyBRL(pending)}
          icon={CircleDollarSign}
          tone="amber"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Vendas hoje" value={kpis.todayCount} tone="slate" />
        <StatCard
          label="Faturamento hoje"
          value={formatMoneyBRL(kpis.todayRevenue)}
          tone="slate"
        />
        <StatCard
          label="Ticket médio hoje"
          value={formatMoneyBRL(kpis.todayTicket)}
          tone="slate"
        />
        <StatCard
          label="Ticket médio no mês"
          value={formatMoneyBRL(kpis.monthTicket)}
          tone="slate"
        />
      </div>
    </div>
  );
}
