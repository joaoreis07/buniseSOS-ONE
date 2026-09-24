import Link from "next/link";
import type { Customer, CustomerStatus } from "@prisma/client";
import {
  CUSTOMER_STATUS_LABELS,
  formatDocument,
} from "@/modules/crm/lib/customer-labels";
import type { CustomerListMetrics } from "@/modules/crm/repositories/customer.repository";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/utilities/cn";

type CustomerRow = Customer & {
  owner: { id: string; name: string | null; email: string } | null;
  metrics: CustomerListMetrics;
};

function statusVariant(status: CustomerStatus) {
  if (status === "ACTIVE") return "default" as const;
  if (status === "BLOCKED") return "destructive" as const;
  return "secondary" as const;
}

export function CustomersTable({
  items,
  canManage,
  canSales,
  canFinance,
  onSelect,
}: {
  items: CustomerRow[];
  canManage: boolean;
  canSales: boolean;
  canFinance: boolean;
  onSelect?: (customer: CustomerRow) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Nenhum cliente encontrado.
        {canManage ? (
          <>
            {" "}
            <Link href="/app/crm/new" className="text-[var(--bos-primary)] hover:underline">
              Criar o primeiro
            </Link>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cliente
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
              Localização
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Origem
            </th>
            {canSales ? (
              <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
                Receita
              </th>
            ) : null}
            {canFinance ? (
              <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
                Em aberto
              </th>
            ) : null}
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((customer) => (
            <tr
              key={customer.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-slate-50",
                onSelect && "cursor-pointer",
              )}
              onClick={() => onSelect?.(customer)}
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--bos-primary)]/10">
                    <span className="text-xs font-bold text-[var(--bos-primary)]">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{customer.name}</div>
                    <div className="truncate text-xs text-slate-400">
                      {customer.email ?? formatDocument(customer.document)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3.5 text-xs text-slate-500 md:table-cell">
                {[customer.city, customer.state].filter(Boolean).join(" / ") || "—"}
              </td>
              <td className="hidden px-4 py-3.5 text-xs text-slate-500 lg:table-cell">
                {customer.origin ?? "—"}
              </td>
              {canSales ? (
                <td className="hidden px-4 py-3.5 text-right text-xs font-semibold text-slate-700 lg:table-cell">
                  {formatMoneyBRL(customer.metrics.salesTotal)}
                </td>
              ) : null}
              {canFinance ? (
                <td className="hidden px-4 py-3.5 text-right text-xs text-slate-600 md:table-cell">
                  {formatMoneyBRL(customer.metrics.openBalance)}
                </td>
              ) : null}
              <td className="px-4 py-3.5 text-center">
                <Badge variant={statusVariant(customer.status)}>
                  {CUSTOMER_STATUS_LABELS[customer.status]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
