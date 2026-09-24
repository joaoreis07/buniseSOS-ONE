import Link from "next/link";
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
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import { formatDateBR } from "@/modules/finance/lib/finance-labels";
import { ACTIVITY_TYPE_LABELS } from "@/modules/crm/lib/activity-labels";
import { PERIOD_PRESET_LABELS, formatCivilDate } from "@/modules/reports/lib/period";
import { PeriodFilter } from "@/modules/reports/components/period-filter";
import {
  CategoryPieChart,
  RevenueExpenseChart,
  SalesBarChart,
} from "@/modules/reports/components/dashboard-charts-dynamic";
import { EmptyBlock } from "@/modules/reports/components/kpi-card";
import type { getDashboardForTenant } from "@/modules/reports/services/dashboard.service";
import {
  PageContainer,
  SectionCard,
  StatCard,
  UsageMeter,
} from "@/shared/components/page-layout";
import type { UsageSnapshot } from "@/modules/billing/lib/entitlements";
import { Badge } from "@/shared/ui/badge";
import type { ChangeResult } from "@/modules/reports/lib/change";

type DashboardData = Awaited<ReturnType<typeof getDashboardForTenant>>;

function trendFromChange(change?: ChangeResult) {
  if (!change || change.label === "—" || change.label === "Novo") return undefined;
  const num = Number.parseFloat(change.label.replace("%", "").replace("+", ""));
  if (Number.isNaN(num)) return undefined;
  return { value: num, label: "vs período anterior" };
}

export function DashboardView({
  data,
  usage,
  companyName,
}: {
  data: DashboardData;
  usage?: UsageSnapshot[];
  companyName?: string;
}) {
  const { range, sections } = data;
  const customerUsage = usage?.find((u) => u.feature === "customers");
  const salesUsage = usage?.find((u) => u.feature === "sales_month");

  const salesBarData =
    data.chart.length > 0
      ? data.chart.slice(-7).map((row) => ({
          label: row.label,
          value: row.revenue,
        }))
      : [];

  const pendingReceivables = data.finance?.upcoming ?? [];
  const overdueCount = data.finance?.overdueCount ?? 0;
  const pendingActivities = data.pendingActivities ?? [];
  const inventoryAlert = data.inventory?.alerts?.[0];

  const usageItems = (usage ?? [])
    .filter((u) => u.limit != null)
    .slice(0, 5);

  const hasContent =
    sections.sales ||
    sections.finance ||
    sections.inventory ||
    sections.purchases ||
    usageItems.length > 0;

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {companyName ?? "Empresa"} · {PERIOD_PRESET_LABELS[range.preset]} ·{" "}
            {formatCivilDate(range.start)} até {formatCivilDate(range.end)}
          </p>
        </div>
        <PeriodFilter action="/app" range={range} compact />
      </div>

      {!hasContent ? (
        <EmptyBlock compact>Nenhum indicador disponível para o seu perfil.</EmptyBlock>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.sales ? (
          <StatCard
            label="Receita no período"
            value={formatMoneyBRL(data.sales.revenue)}
            trend={trendFromChange(data.sales.revenueChange)}
            icon={TrendingUp}
            tone="blue"
          />
        ) : null}
        {data.activeCustomers != null ? (
          <StatCard
            label="Clientes ativos"
            value={data.activeCustomers}
            sub={
              customerUsage?.limit
                ? `${customerUsage.limit} é o limite do plano Free`
                : undefined
            }
            icon={Users}
            tone="green"
          />
        ) : null}
        {data.sales ? (
          <StatCard
            label="Vendas no período"
            value={data.sales.count}
            sub={
              salesUsage?.limit
                ? `${salesUsage.limit} é o limite do plano Free/mês`
                : "concluídas no período"
            }
            trend={trendFromChange(data.sales.countChange)}
            icon={ShoppingCart}
            tone="blue"
          />
        ) : null}
        {data.finance ? (
          <StatCard
            label="A receber"
            value={formatMoneyBRL(data.finance.open)}
            sub={`${overdueCount} vencida(s)`}
            icon={DollarSign}
            tone="amber"
          />
        ) : null}
      </div>

      {(sections.sales || sections.purchases) && data.revenueExpense.length > 0 ? (
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
            <RevenueExpenseChart data={data.revenueExpense} />
          </div>

          {sections.sales && data.categoryBreakdown.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-800">Receita por categoria</h3>
                <p className="text-xs text-slate-400">Período atual</p>
              </div>
              <CategoryPieChart data={data.categoryBreakdown} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {sections.sales ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-1 text-sm font-bold text-slate-800">Vendas por período</h3>
            <SalesBarChart
              data={salesBarData}
              subtitle={`${formatCivilDate(range.start)} – ${formatCivilDate(range.end)}`}
            />
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Alertas</h3>
          <div className="space-y-3">
            {overdueCount > 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3">
                <DollarSign className="mt-0.5 size-[15px] shrink-0 text-red-500" />
                <div>
                  <div className="text-xs font-semibold text-red-700">
                    {overdueCount} parcela(s) vencida(s)
                  </div>
                  <div className="text-xs text-red-500">Verifique o financeiro</div>
                </div>
              </div>
            ) : null}
            {inventoryAlert ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                <Package className="mt-0.5 size-[15px] shrink-0 text-amber-500" />
                <div>
                  <div className="text-xs font-semibold text-amber-700">
                    Estoque abaixo do mínimo
                  </div>
                  <div className="text-xs text-amber-500">
                    {inventoryAlert.name}: {inventoryAlert.quantity} un.
                  </div>
                </div>
              </div>
            ) : null}
            {customerUsage && customerUsage.status !== "ok" ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                <AlertTriangle className="mt-0.5 size-[15px] shrink-0 text-amber-500" />
                <div>
                  <div className="text-xs font-semibold text-amber-700">
                    Limite de clientes: {customerUsage.used} / {customerUsage.limit}
                  </div>
                  <div className="text-xs text-amber-500">
                    Considere fazer upgrade para PRO
                  </div>
                </div>
              </div>
            ) : null}
            {pendingActivities.length > 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <Calendar className="mt-0.5 size-[15px] shrink-0 text-blue-500" />
                <div>
                  <div className="text-xs font-semibold text-blue-700">
                    {pendingActivities.length} atividade(s) pendente(s)
                  </div>
                  <div className="text-xs text-blue-500">Verifique o CRM hoje</div>
                </div>
              </div>
            ) : null}
            {overdueCount === 0 &&
            !inventoryAlert &&
            (!customerUsage || customerUsage.status === "ok") &&
            pendingActivities.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum alerta no momento.</p>
            ) : null}
          </div>
        </div>

        {usageItems.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Uso do plano Free</h3>
              <Link
                href="/app/settings/billing"
                className="text-xs text-[var(--bos-primary)] hover:underline"
              >
                Fazer upgrade
              </Link>
            </div>
            <div className="space-y-3.5">
              {usageItems.map((item) => (
                <UsageMeter
                  key={item.feature}
                  label={item.label}
                  used={item.used}
                  limit={item.limit!}
                  status={item.status}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.finance ? (
          <SectionCard
            title="A receber — próximos vencimentos"
            footerLink={{ href: "/app/finance", label: "Ver tudo" }}
          >
            {pendingReceivables.length === 0 ? (
              <p className="px-5 py-6 text-center text-xs text-slate-400">
                Nenhum vencimento próximo.
              </p>
            ) : (
              <div className="divide-y divide-slate-50">
                {pendingReceivables.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-800">
                        {item.customerName ?? "Sem cliente"}
                      </div>
                      <div className="truncate text-xs text-slate-400">
                        {formatSaleNumber(item.saleNumber)} · parcela {item.number} ·{" "}
                        {formatDateBR(item.dueDate)}
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
            )}
          </SectionCard>
        ) : null}

        {pendingActivities.length > 0 ? (
          <SectionCard
            title="Atividades pendentes"
            footerLink={{ href: "/app/crm/activities", label: "Ver tudo" }}
          >
            <div className="divide-y divide-slate-50">
              {pendingActivities.map((activity) => (
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
                        {ACTIVITY_TYPE_LABELS[activity.type]} ·{" "}
                        {activity.customer?.name ?? activity.lead?.name ?? "—"} ·{" "}
                        {formatDateBR(activity.dueAt)}
                      </div>
                    </div>
                  </div>
                  <div className="ml-3 shrink-0">
                    <Badge variant="outline">Pendente</Badge>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}
      </div>

      {(sections.inventory || data.purchases) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.inventory ? (
            <SectionCard title="Estoque" description="Posição atual">
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-500">Com saldo</span>
                  <span className="font-semibold">{data.inventory.inStock}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Abaixo do mínimo</span>
                  <span className="font-semibold">{data.inventory.belowMinimum}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Sem estoque</span>
                  <span className="font-semibold">{data.inventory.outOfStock}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Valor estimado</span>
                  <span className="font-semibold">
                    {formatMoneyBRL(data.inventory.estimatedValue)}
                  </span>
                </li>
              </ul>
            </SectionCard>
          ) : null}
          {data.purchases ? (
            <SectionCard title="Compras" description="Recebidas no período">
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-500">Recebidas</span>
                  <span className="font-semibold">{data.purchases.count}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Valor comprado</span>
                  <span className="font-semibold">
                    {formatMoneyBRL(data.purchases.value)}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Fornecedores ativos</span>
                  <span className="font-semibold">{data.purchases.activeSuppliers}</span>
                </li>
              </ul>
            </SectionCard>
          ) : null}
        </div>
      )}
    </PageContainer>
  );
}
