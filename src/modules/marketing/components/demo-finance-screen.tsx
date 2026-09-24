"use client";

import { useState } from "react";
import {
  DEMO_FINANCE_KPIS,
  DEMO_FINANCE_ROWS,
} from "@/modules/marketing/demo-data";
import { FinanceKpis } from "@/modules/finance/components/finance-table";
import {
  RECEIVABLE_STATUS_LABELS,
} from "@/modules/finance/lib/finance-labels";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import {
  DataTableShell,
  ModulePageHeader,
  PageContainer,
  PaginationBar,
} from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/utilities/cn";

const STATUS_OPTIONS = [
  { value: "", label: "Todas" },
  ...Object.entries(RECEIVABLE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

function statusVariant(status: keyof typeof RECEIVABLE_STATUS_LABELS) {
  if (status === "PAID") return "success" as const;
  if (status === "OVERDUE") return "destructive" as const;
  if (status === "CANCELLED") return "secondary" as const;
  return "warning" as const;
}

export function DemoFinanceScreen() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [customer, setCustomer] = useState("");

  const customers = [...new Set(DEMO_FINANCE_ROWS.map((row) => row.customer))];

  const filtered = DEMO_FINANCE_ROWS.filter((row) => {
    const matchSearch =
      row.customer.toLowerCase().includes(search.toLowerCase()) ||
      String(row.saleNumber).includes(search);
    const matchStatus = !status || row.status === status;
    const matchCustomer = !customer || row.customer === customer;
    return matchSearch && matchStatus && matchCustomer;
  });

  return (
    <PageContainer>
      <ModulePageHeader
        title="Financeiro"
        subtitle={`Contas a receber · ${DEMO_FINANCE_ROWS.length} registro(s)`}
      />

      <FinanceKpis kpis={DEMO_FINANCE_KPIS} />

      <div className="space-y-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => setStatus(option.value)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition-all",
                status === option.value
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="demo-fin-q">Busca</Label>
              <Input
                id="demo-fin-q"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cliente ou venda"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="demo-fin-customer">Cliente</Label>
              <select
                id="demo-fin-customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">Todos</option>
                {customers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                  setCustomer("");
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DataTableShell className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Venda</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Cliente</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">Vencimento</th>
              <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">Total</th>
              <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">Pago</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Saldo</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "transition-colors hover:bg-slate-50",
                  item.status === "OVERDUE" && "bg-red-50/30",
                )}
              >
                <td className="px-5 py-3.5">
                  <span className="font-mono text-xs font-semibold text-[var(--bos-primary)]">
                    {formatSaleNumber(item.saleNumber)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{item.customer}</td>
                <td className="hidden px-4 py-3.5 text-center text-xs font-medium text-slate-600 md:table-cell">
                  {item.dueDate}
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
                  {item.status !== "PAID" ? (
                    <Button type="button" variant="link" size="sm" disabled className="h-auto p-0 text-xs">
                      Registrar
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>

      <PaginationBar
        page={1}
        pageCount={1}
        total={filtered.length}
        totalLabel="registro(s)"
      />
    </PageContainer>
  );
}
