"use client";

import { useState } from "react";
import {
  Calendar,
  DollarSign,
  Search,
  Target,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  DEMO_CRM_ACTIVITIES,
  DEMO_CRM_FUNNEL,
  DEMO_CUSTOMERS,
  DEMO_LEADS,
  DEMO_OPPORTUNITIES,
  DEMO_PIPELINE,
} from "@/modules/marketing/demo-data";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { CrmFunnelChart } from "@/modules/reports/components/dashboard-charts-dynamic";
import { PageContainer, SectionCard, StatCard } from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/utilities/cn";

type CrmTab =
  | "dashboard"
  | "customers"
  | "leads"
  | "opportunities"
  | "pipeline"
  | "activities";

function DemoCustomerDrawer({
  customer,
  onClose,
}: {
  customer: (typeof DEMO_CUSTOMERS)[number];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"dados" | "vendas" | "360">("dados");

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" aria-hidden />
      <div
        className="relative flex h-full w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label={`Cliente ${customer.name}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">{customer.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-lg font-bold text-slate-400 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 flex gap-1 rounded-lg bg-slate-50 p-1">
            {(
              [
                ["dados", "Dados"],
                ["vendas", "Vendas"],
                ["360", "Visão 360°"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-semibold transition-all",
                  tab === id
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "dados" ? (
            <div className="space-y-4 text-sm">
              <p>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">Telefone</span>
                <br />
                <span className="font-medium text-slate-800">{customer.phone}</span>
              </p>
              <p>
                <span className="text-[10px] uppercase tracking-wider text-slate-400">A receber</span>
                <br />
                <span className="font-medium text-slate-800">{customer.receivable}</span>
              </p>
            </div>
          ) : null}
          {tab === "vendas" ? (
            <ul className="space-y-2 text-sm">
              {customer.history.map((row) => (
                <li
                  key={row.label}
                  className="flex justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <span>{row.label}</span>
                  <span className="font-semibold">{row.value}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {tab === "360" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Vendas" value={customer.sales} icon={Users} tone="blue" />
              <StatCard label="A receber" value={customer.receivable} icon={DollarSign} tone="amber" />
              <StatCard label="Atividades" value={customer.activities} icon={Calendar} tone="green" />
            </div>
          ) : null}
        </div>
        <div className="sticky bottom-0 border-t border-slate-100 bg-white px-6 py-4 text-center text-xs text-slate-400">
          Demonstração — ações desabilitadas
        </div>
      </div>
    </div>
  );
}

export function DemoCrmPageContent({ active }: { active: CrmTab }) {
  const [search, setSearch] = useState("");
  const [drawerCustomerId, setDrawerCustomerId] = useState<string | null>(null);
  const drawerCustomer = drawerCustomerId
    ? DEMO_CUSTOMERS.find((c) => c.id === drawerCustomerId)
    : null;
  const filteredCustomers = DEMO_CUSTOMERS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageContainer>
      <CrmSubnav variant="demo" active={active} />

      {active === "dashboard" ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Clientes ativos" value={2} icon={Users} tone="blue" />
            <StatCard label="Leads" value={DEMO_LEADS.length} icon={UserPlus} tone="green" />
            <StatCard label="Oportunidades" value={DEMO_OPPORTUNITIES.length} icon={Target} tone="blue" />
            <StatCard label="Valor em aberto" value="R$ 28.164,00" icon={DollarSign} tone="amber" />
            <StatCard label="Atividades pendentes" value={2} icon={Calendar} tone="amber" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-bold text-slate-800">Funil de vendas</h3>
              <CrmFunnelChart data={[...DEMO_CRM_FUNNEL]} />
            </div>
            <SectionCard title="Atividades recentes">
              <div className="divide-y divide-slate-50">
                {DEMO_CRM_ACTIVITIES.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-800">{activity.title}</div>
                      <div className="text-xs text-slate-400">{activity.type} · {activity.client}</div>
                    </div>
                    <Badge variant="outline">{activity.status}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}

      {active === "customers" ? (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar clientes…"
                className="h-9 pl-9"
              />
            </div>
            <Button type="button" disabled size="sm">
              Novo cliente
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Cliente</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">Status</th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">A receber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => setDrawerCustomerId(customer.id)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--bos-primary)]/10 text-xs font-bold text-[var(--bos-primary)]">
                          {customer.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800">{customer.name}</div>
                          <div className="text-xs text-slate-400">{customer.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3.5 sm:table-cell">
                      <Badge variant={customer.status === "Ativo" ? "default" : "secondary"}>{customer.status}</Badge>
                    </td>
                    <td className="hidden px-4 py-3.5 text-right text-xs font-semibold text-slate-700 md:table-cell">{customer.receivable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {active === "leads" ? (
        <>
          <div className="mb-4 flex justify-end">
            <Button type="button" disabled size="sm">Novo lead</Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Lead</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">Origem</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">Estágio</th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {DEMO_LEADS.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{lead.name}</div>
                      <div className="text-xs text-slate-400">{lead.company}</div>
                    </td>
                    <td className="hidden px-4 py-3.5 sm:table-cell"><Badge variant="outline">{lead.origin}</Badge></td>
                    <td className="hidden px-4 py-3.5 md:table-cell"><Badge variant="secondary">{lead.status}</Badge></td>
                    <td className="hidden px-4 py-3.5 text-right text-xs font-semibold text-slate-700 lg:table-cell">{lead.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {active === "opportunities" ? (
        <>
          <p className="mb-4 text-sm text-slate-500">
            {DEMO_OPPORTUNITIES.length} oportunidades · valor total{" "}
            <span className="font-semibold text-slate-700">R$ 28.164,00/ano</span>
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Oportunidade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Estágio</th>
                  <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">Valor/mês</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">Prob.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {DEMO_OPPORTUNITIES.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{opp.name}</div>
                      <div className="text-xs text-slate-400">{opp.client}</div>
                    </td>
                    <td className="px-4 py-3.5"><Badge variant="secondary">{opp.stage}</Badge></td>
                    <td className="hidden px-4 py-3.5 text-right text-xs font-semibold text-slate-700 md:table-cell">{opp.value}</td>
                    <td className="hidden px-4 py-3.5 sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-[var(--bos-primary)]" style={{ width: `${opp.probability}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{opp.probability}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {active === "pipeline" ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {DEMO_PIPELINE.map((column) => (
            <div key={column.stage} className="w-64 shrink-0">
              <div className={cn("mb-3 rounded-xl border border-slate-200 border-t-4 bg-white px-4 py-3", column.color)}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{column.label}</span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{column.items.length}</span>
                </div>
              </div>
              <div className="space-y-2">
                {column.items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="text-xs font-semibold text-slate-800">{item.name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{item.client}</p>
                    <p className="mt-2 text-xs font-bold text-slate-700">{item.value}</p>
                  </div>
                ))}
                <button type="button" disabled className="w-full rounded-xl border border-dashed border-slate-200 py-2 text-[10px] font-medium text-slate-400">+ Adicionar</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {active === "activities" ? (
        <>
          <div className="mb-4 flex justify-end">
            <Button type="button" disabled size="sm">Nova atividade</Button>
          </div>
          <ul className="space-y-2">
            {DEMO_CRM_ACTIVITIES.map((item) => (
              <li key={item.id} className={cn("flex gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4", item.status === "Concluída" && "opacity-60")}>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                  <Calendar className="size-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-800">{item.title}</div>
                  <p className="text-xs text-slate-400">{item.client} · {item.owner}</p>
                </div>
                <Badge variant="outline">{item.status}</Badge>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {drawerCustomer ? (
        <DemoCustomerDrawer customer={drawerCustomer} onClose={() => setDrawerCustomerId(null)} />
      ) : null}
    </PageContainer>
  );
}
