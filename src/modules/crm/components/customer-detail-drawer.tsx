"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, TrendingUp, User } from "lucide-react";
import { loadCustomerDrawerAction } from "@/modules/crm/actions/customer.actions";
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_TYPE_LABELS,
  formatDocument,
  formatPhone,
} from "@/modules/crm/lib/customer-labels";
import { formatDateBR } from "@/modules/finance/lib/finance-labels";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utilities/cn";

type DrawerData = NonNullable<Awaited<ReturnType<typeof loadCustomerDrawerAction>>["data"]>;

export function CustomerDetailDrawer({
  customerId,
  onClose,
  canManage,
  canSales,
}: {
  customerId: string | null;
  onClose: () => void;
  canManage: boolean;
  canSales: boolean;
}) {
  const [tab, setTab] = useState<"dados" | "vendas" | "360">("dados");
  const [data, setData] = useState<DrawerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!customerId) {
      setData(null);
      return;
    }
    setTab("dados");
    startTransition(async () => {
      const result = await loadCustomerDrawerAction(customerId);
      if (result.ok && result.data) {
        setData(result.data);
        setError(null);
      } else {
        setData(null);
        setError(result.error ?? "Não foi possível carregar o cliente");
      }
    });
  }, [customerId]);

  if (!customerId) return null;

  const customer = data?.customer;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" aria-hidden />
      <div
        className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do cliente"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">
            {pending && !customer ? "Carregando…" : (customer?.name ?? "Cliente")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-lg font-bold text-slate-400 hover:text-slate-600"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {error ? (
          <p className="px-6 py-8 text-sm text-red-600">{error}</p>
        ) : customer ? (
          <>
            <div className="flex-1 px-6 py-5">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge variant={customer.status === "ACTIVE" ? "default" : "secondary"}>
                  {CUSTOMER_STATUS_LABELS[customer.status]}
                </Badge>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {CUSTOMER_TYPE_LABELS[customer.type]}
                </span>
                {customer.origin ? (
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                    {customer.origin}
                  </span>
                ) : null}
              </div>

              <div className="mb-5 flex gap-1 rounded-lg bg-slate-50 p-1">
                {(
                  [
                    { id: "dados", label: "Dados" },
                    { id: "vendas", label: "Vendas" },
                    { id: "360", label: "Visão 360°" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-xs font-semibold transition-all",
                      tab === item.id
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {tab === "dados" ? (
                <div className="space-y-4">
                  {[
                    {
                      icon: <Mail size={14} />,
                      label: "E-mail",
                      value: customer.email ?? "—",
                    },
                    {
                      icon: <Phone size={14} />,
                      label: "Telefone",
                      value: formatPhone(customer.mobile ?? customer.phone),
                    },
                    {
                      icon: <MapPin size={14} />,
                      label: "Localização",
                      value: [customer.city, customer.state].filter(Boolean).join(" / ") || "—",
                    },
                    {
                      icon: <User size={14} />,
                      label: "Documento",
                      value: formatDocument(customer.document),
                    },
                  ].map((field) => (
                    <div key={field.label} className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-400">
                        {field.icon}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400">
                          {field.label}
                        </div>
                        <div className="text-sm font-medium text-slate-800">{field.value}</div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">
                      Cliente desde
                    </div>
                    <div className="text-sm font-medium text-slate-800">
                      {formatDateBR(customer.createdAt)}
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === "vendas" && data.overview?.sales ? (
                <div>
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <TrendingUp className="size-5 text-blue-500" />
                    <div>
                      <div className="text-xs text-blue-500">Receita total</div>
                      <div className="text-xl font-bold text-blue-700">
                        {formatMoneyBRL(data.overview.sales.total)}
                      </div>
                    </div>
                  </div>
                  {data.overview.recentSales.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">
                      Nenhuma venda recente registrada.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-50">
                      {data.overview.recentSales.map((sale) => (
                        <li key={sale.id} className="py-2.5 text-sm">
                          <Link
                            href={`/app/sales/${sale.id}`}
                            className="font-medium text-[var(--bos-primary)] hover:underline"
                          >
                            Venda #{sale.number}
                          </Link>
                          <span className="ml-2 text-slate-500">
                            {formatMoneyBRL(sale.total)} · {formatDateBR(sale.completedAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : tab === "vendas" ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Sem dados de vendas para este cliente.
                </p>
              ) : null}

              {tab === "360" && data.overview ? (
                <div className="space-y-3">
                  {[
                    {
                      label: "Receita total",
                      value: formatMoneyBRL(data.overview.sales?.total ?? 0),
                      color: "text-emerald-600",
                    },
                    {
                      label: "Vendas realizadas",
                      value: String(data.overview.sales?.count ?? 0),
                      color: "text-slate-700",
                    },
                    {
                      label: "Recebido",
                      value: formatMoneyBRL(data.overview.finance?.received ?? 0),
                      color: "text-slate-700",
                    },
                    {
                      label: "Em aberto",
                      value: formatMoneyBRL(data.overview.finance?.open ?? 0),
                      color: "text-amber-600",
                    },
                    {
                      label: "Vencido",
                      value: formatMoneyBRL(data.overview.finance?.overdue ?? 0),
                      color: "text-red-600",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between border-b border-slate-50 py-2.5"
                    >
                      <span className="text-sm text-slate-500">{item.label}</span>
                      <span className={cn("text-sm font-bold", item.color)}>{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : tab === "360" ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Sem visão 360° disponível.
                </p>
              ) : null}
            </div>

            <div className="sticky bottom-0 flex gap-2 border-t border-slate-100 bg-white px-6 py-4">
              {canManage ? (
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/app/crm/${customer.id}/edit`}>Editar</Link>
                </Button>
              ) : null}
              {canSales ? (
                <Button asChild className="flex-1">
                  <Link href={`/app/sales/new?customerId=${customer.id}`}>Nova venda</Link>
                </Button>
              ) : null}
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href={`/app/crm/${customer.id}`}>Ficha completa</Link>
              </Button>
            </div>
          </>
        ) : (
          <p className="px-6 py-8 text-sm text-slate-400">Carregando cliente…</p>
        )}
      </div>
    </div>
  );
}
