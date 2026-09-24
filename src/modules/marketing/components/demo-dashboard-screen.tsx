"use client";

import {
  AlertTriangle,
  Calendar,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  DEMO_CATEGORY_BREAKDOWN,
  DEMO_FREE_USAGE,
  DEMO_PENDING_ACTIVITIES,
  DEMO_FINANCE_ROWS,
  DEMO_REVENUE_EXPENSE,
  DEMO_SALES_CHART,
} from "@/modules/marketing/demo-data";
import {
  CategoryPieChart,
  RevenueExpenseChart,
  SalesBarChart,
} from "@/modules/reports/components/dashboard-charts-dynamic";
import {
  PageContainer,
  SectionCard,
  StatCard,
  UsageMeter,
} from "@/shared/components/page-layout";
import { RECEIVABLE_STATUS_LABELS } from "@/modules/finance/lib/finance-labels";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import { Badge } from "@/shared/ui/badge";

export function DemoDashboardScreen() {
  const overdueCount = DEMO_FINANCE_ROWS.filter((r) => r.status === "OVERDUE").length;

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            Empresa Exemplo Ltda. · Setembro 2026 · dados fictícios
          </p>
        </div>
        <select
          className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--bos-primary)]/20"
          defaultValue="set"
          aria-label="Período"
        >
          <option value="set">Setembro 2026</option>
          <option value="ago">Agosto 2026</option>
          <option value="jul">Julho 2026</option>
        </select>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Receita no período"
          value="R$ 48.720,00"
          trend={{ value: 12.4, label: "vs período anterior" }}
          icon={TrendingUp}
          tone="blue"
        />
        <StatCard
          label="Clientes ativos"
          value={42}
          sub="50 é o limite do plano Free"
          icon={Users}
          tone="green"
        />
        <StatCard
          label="Vendas no período"
          value={24}
          sub="30 é o limite do plano Free/mês"
          trend={{ value: 8.2, label: "vs período anterior" }}
          icon={ShoppingCart}
          tone="blue"
        />
        <StatCard
          label="A receber"
          value="R$ 4.756,00"
          sub={`${overdueCount} vencida(s)`}
          icon={DollarSign}
          tone="amber"
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Receita vs Despesa</h3>
              <p className="text-xs text-slate-400">Últimos 6 meses</p>
            </div>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-3 rounded bg-[var(--bos-primary)]" />
                Receita
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-3 rounded bg-slate-200" />
                Despesa
              </span>
            </div>
          </div>
          <RevenueExpenseChart data={[...DEMO_REVENUE_EXPENSE]} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-slate-800">Receita por categoria</h3>
            <p className="text-xs text-slate-400">Período atual</p>
          </div>
          <CategoryPieChart data={[...DEMO_CATEGORY_BREAKDOWN]} />
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-1 text-sm font-bold text-slate-800">Vendas por período</h3>
          <SalesBarChart
            data={[...DEMO_SALES_CHART]}
            subtitle="01/09/2026 – 22/09/2026"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Alertas</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3">
              <DollarSign className="mt-0.5 size-[15px] shrink-0 text-red-500" />
              <div>
                <div className="text-xs font-semibold text-red-700">
                  {overdueCount} parcela(s) vencida(s)
                </div>
                <div className="text-xs text-red-500">Verifique o financeiro</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
              <Package className="mt-0.5 size-[15px] shrink-0 text-amber-500" />
              <div>
                <div className="text-xs font-semibold text-amber-700">
                  Estoque abaixo do mínimo
                </div>
                <div className="text-xs text-amber-500">Produto B: 8 un.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 size-[15px] shrink-0 text-amber-500" />
              <div>
                <div className="text-xs font-semibold text-amber-700">
                  Limite de clientes: 42 / 50
                </div>
                <div className="text-xs text-amber-500">
                  Considere fazer upgrade para PRO
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <Calendar className="mt-0.5 size-[15px] shrink-0 text-blue-500" />
              <div>
                <div className="text-xs font-semibold text-blue-700">
                  {DEMO_PENDING_ACTIVITIES.length} atividade(s) pendente(s)
                </div>
                <div className="text-xs text-blue-500">Verifique o CRM hoje</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Uso do plano Free</h3>
            <span className="text-xs text-[var(--bos-primary)]">Demonstração</span>
          </div>
          <div className="space-y-3.5">
            {DEMO_FREE_USAGE.map((item) => (
              <UsageMeter
                key={item.label}
                label={item.label}
                used={item.used}
                limit={item.limit}
                status={item.status}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="A receber — próximos vencimentos">
          <div className="divide-y divide-slate-50">
            {DEMO_FINANCE_ROWS.filter((r) => r.status !== "PAID")
              .slice(0, 5)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-800">
                      {formatSaleNumber(item.saleNumber)} · {item.customer}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      Vencimento · {item.dueDate} ·{" "}
                      {RECEIVABLE_STATUS_LABELS[item.status]}
                    </div>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <div className="text-xs font-bold text-slate-800">
                      {formatMoneyBRL(item.remainingAmount)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </SectionCard>

        <SectionCard title="Atividades pendentes">
          <div className="divide-y divide-slate-50">
            {DEMO_PENDING_ACTIVITIES.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
                    <Clock className="size-[13px] text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-800">
                      {activity.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {activity.type} · {activity.client} · {activity.dueDate}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="ml-3 shrink-0">
                  Pendente
                </Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

    </PageContainer>
  );
}
