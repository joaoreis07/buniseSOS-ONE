import Link from "next/link";
import type { Purchase, PurchaseStatus } from "@prisma/client";
import { Badge } from "@/shared/ui/badge";
import { StatCard } from "@/shared/components/page-layout";
import { formatDateTimeBR, formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import {
  formatPurchaseNumber,
  PURCHASE_STATUS_LABELS,
} from "@/modules/purchases/lib/purchase-labels";

type PurchaseRow = Purchase & {
  supplier: { id: string; name: string } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  _count: { items: number };
};

function statusVariant(status: PurchaseStatus) {
  if (status === "RECEIVED") return "default" as const;
  if (status === "CANCELLED") return "destructive" as const;
  return "secondary" as const;
}

export function PurchaseKpis({
  kpis,
}: {
  kpis: {
    monthCount: number;
    monthValue: number;
    receivedCount: number;
    cancelledCount: number;
  };
}) {
  const cards = [
    { label: "Compras no mês", value: String(kpis.monthCount), tone: "blue" as const },
    { label: "Valor recebido", value: formatMoneyBRL(kpis.monthValue), tone: "emerald" as const },
    { label: "Recebidas", value: String(kpis.receivedCount), tone: "slate" as const },
    { label: "Canceladas", value: String(kpis.cancelledCount), tone: "rose" as const },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

export function PurchasesTable({ items }: { items: PurchaseRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Nenhuma compra encontrada.{" "}
        <Link href="/app/purchases/new" className="text-[var(--bos-primary)] hover:underline">
          Registrar a primeira
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Nº Compra
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fornecedor
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
              Responsável
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((purchase) => (
            <tr
              key={purchase.id}
              className="transition-colors hover:bg-slate-50"
            >
              <td className="px-5 py-3.5">
                <Link
                  href={`/app/purchases/${purchase.id}`}
                  className="font-mono text-xs font-semibold text-[var(--bos-primary)] hover:underline"
                >
                  {formatPurchaseNumber(purchase.number)}
                </Link>
              </td>
              <td className="px-4 py-3.5 font-medium text-slate-800">
                {purchase.supplier?.name ?? "—"}
              </td>
              <td className="hidden px-4 py-3.5 text-xs text-slate-400 md:table-cell">
                {formatDateTimeBR(purchase.purchasedAt).split(",")[0]}
              </td>
              <td className="hidden px-4 py-3.5 text-center text-xs text-slate-500 lg:table-cell">
                {purchase._count.items}
              </td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-800">
                {formatMoneyBRL(purchase.total)}
              </td>
              <td className="px-4 py-3.5 text-center">
                <Badge variant={statusVariant(purchase.status)}>
                  {PURCHASE_STATUS_LABELS[purchase.status]}
                </Badge>
              </td>
              <td className="hidden px-4 py-3.5 text-xs text-slate-500 lg:table-cell">
                {purchase.createdBy?.name ?? purchase.createdBy?.email ?? "—"}
              </td>
              <td className="px-4 py-3.5 text-right">
                <Link
                  href={`/app/purchases/${purchase.id}`}
                  className="text-sm text-[var(--bos-primary)] hover:underline"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
