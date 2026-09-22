import Link from "next/link";
import { CircleDollarSign, ShoppingBag, Wallet, Warehouse } from "lucide-react";
import {
  formatMoneyBRL,
  PAYMENT_METHOD_LABELS,
} from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import { formatPurchaseNumber } from "@/modules/purchases/lib/purchase-labels";
import { formatDateBR } from "@/modules/finance/lib/finance-labels";
import { STOCK_LEVEL_LABELS } from "@/modules/inventory/lib/inventory-labels";
import { PRODUCT_TYPE_LABELS } from "@/modules/products/lib/product-labels";
import { PERIOD_PRESET_LABELS, formatCivilDate } from "@/modules/reports/lib/period";
import { PeriodFilter } from "@/modules/reports/components/period-filter";
import { MoneyBarList } from "@/modules/reports/components/bar-list";
import { EmptyBlock } from "@/modules/reports/components/kpi-card";
import type { getDashboardForTenant } from "@/modules/reports/services/dashboard.service";
import {
  MetricList,
  PageContainer,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

type DashboardData = Awaited<ReturnType<typeof getDashboardForTenant>>;

export function DashboardView({
  data,
  canViewReports,
}: {
  data: DashboardData;
  canViewReports: boolean;
}) {
  const { range, sections } = data;
  const hasAny =
    sections.sales || sections.finance || sections.inventory || sections.purchases;
  const criticalStock =
    (data.inventory?.belowMinimum ?? 0) + (data.inventory?.outOfStock ?? 0);

  const kpis: Array<{
    label: string;
    value: string | number;
    hint?: string;
    icon: typeof CircleDollarSign;
    tone: "blue" | "emerald" | "amber" | "rose";
  }> = [];
  if (data.sales) {
    kpis.push(
      {
        label: "Faturamento",
        value: formatMoneyBRL(data.sales.revenue),
        hint: data.sales.revenueChange?.label,
        icon: CircleDollarSign,
        tone: "blue",
      },
      {
        label: "Vendas",
        value: data.sales.count,
        hint: data.sales.countChange?.label ?? "concluídas no período",
        icon: ShoppingBag,
        tone: "emerald",
      },
    );
  }
  if (data.finance) {
    kpis.push({
      label: "A receber",
      value: formatMoneyBRL(data.finance.open),
      hint: `${data.finance.openCount} em aberto · ${data.finance.overdueCount} vencida(s)`,
      icon: Wallet,
      tone: "amber",
    });
  }
  if (data.inventory) {
    kpis.push({
      label: "Estoque crítico",
      value: criticalStock,
      hint: `${data.inventory.outOfStock} sem estoque`,
      icon: Warehouse,
      tone: criticalStock > 0 ? "rose" : "blue",
    });
  }

  const alerts = [
    ...(data.finance?.upcoming ?? []).map((item) => ({
      key: item.id,
      title: `${formatSaleNumber(item.saleNumber)} · parcela ${item.number}`,
      meta: `${item.customerName ?? "Sem cliente"} · ${formatDateBR(item.dueDate)} · ${formatMoneyBRL(item.remainingAmount)}`,
    })),
    ...(data.inventory?.alerts ?? []).map((item) => ({
      key: item.productId,
      title: item.name,
      meta: `${item.sku} · ${item.quantity} / mín. ${item.minimumQuantity} · ${STOCK_LEVEL_LABELS[item.stockLevel]}`,
    })),
  ].slice(0, 6);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        description={`${PERIOD_PRESET_LABELS[range.preset]} · ${formatCivilDate(range.start)} até ${formatCivilDate(range.end)}`}
        actions={
          canViewReports ? (
            <Button asChild variant="outline">
              <Link href="/app/reports">Abrir relatórios</Link>
            </Button>
          ) : null
        }
      />

      <PeriodFilter action="/app" range={range} compact />

      {!hasAny ? (
        <EmptyBlock compact>Nenhum indicador disponível para o seu perfil.</EmptyBlock>
      ) : null}

      {kpis.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <StatCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              hint={kpi.hint}
              icon={kpi.icon}
              tone={kpi.tone}
            />
          ))}
        </div>
      ) : null}

      {data.sales || data.finance || data.inventory || data.purchases ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.sales ? (
            <SectionCard title="Vendas" description="Resumo operacional do período">
              <MetricList
                items={[
                  { label: "Concluídas", value: data.sales.count },
                  { label: "Ticket médio", value: formatMoneyBRL(data.sales.ticket) },
                  {
                    label: "Variação do ticket",
                    value: data.sales.ticketChange?.label ?? "—",
                  },
                  { label: "Canceladas", value: data.sales.cancelled },
                ]}
              />
              <p className="mt-3 text-xs text-slate-400">
                Somente vendas concluídas entram no faturamento.
              </p>
            </SectionCard>
          ) : null}
          {data.finance || data.inventory || data.purchases ? (
            <SectionCard title="Financeiro e operação" description="Indicadores do recorte atual">
              <MetricList
                items={[
                  ...(data.finance
                    ? [
                        {
                          label: "Recebido",
                          value: formatMoneyBRL(data.finance.received),
                        },
                        {
                          label: "Vencido",
                          value: formatMoneyBRL(data.finance.overdue),
                        },
                      ]
                    : []),
                  ...(data.inventory
                    ? [{ label: "Com saldo", value: data.inventory.inStock }]
                    : []),
                  ...(data.purchases
                    ? [{ label: "Compras recebidas", value: data.purchases.count }]
                    : []),
                ]}
              />
            </SectionCard>
          ) : null}
        </div>
      ) : null}

      {sections.sales ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.7fr)]">
          <SectionCard
            title="Desempenho"
            description={
              range.group === "day"
                ? "Faturamento por dia"
                : range.group === "week"
                  ? "Faturamento por semana"
                  : "Faturamento por mês"
            }
          >
            <MoneyBarList
              compact
              empty="Nenhuma venda no período selecionado."
              items={data.chart.map((row) => ({
                key: row.key,
                label: row.label,
                value: row.revenue,
                hint: `${row.count} venda(s)`,
              }))}
            />
          </SectionCard>
          <SectionCard title="Pendências" description="Vencimentos e estoque">
            {alerts.length === 0 ? (
              <EmptyBlock compact>Nenhuma pendência neste recorte.</EmptyBlock>
            ) : (
              <ul className="divide-y divide-slate-100">
                {alerts.map((item) => (
                  <li key={item.key} className="py-2.5">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.meta}</p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      ) : null}

      {sections.sales ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Pagamentos" description="Como as vendas do período foram recebidas">
            <MoneyBarList
              compact
              empty="Nenhuma venda no período selecionado."
              items={data.payments.map((row) => ({
                key: row.paymentMethod,
                label: PAYMENT_METHOD_LABELS[row.paymentMethod],
                value: row.revenue,
                hint: `${row.count} venda(s)`,
              }))}
            />
          </SectionCard>
          <SectionCard title="Produtos" description="Ranking por faturamento">
            {data.products.length === 0 ? (
              <EmptyBlock compact>Nenhuma venda no período selecionado.</EmptyBlock>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.products.map((row, index) => (
                  <li
                    key={`${row.productId}-${row.sku}`}
                    className="flex items-baseline justify-between gap-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <span className="text-slate-400">{index + 1}.</span> {row.name}
                      <span className="text-slate-400">
                        {" "}
                        · {PRODUCT_TYPE_LABELS[row.type]}
                      </span>
                    </span>
                    <span className="shrink-0 text-slate-600">
                      {row.quantity} un. · {formatMoneyBRL(row.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      ) : null}

      {data.finance ? (
        <SectionCard
          title="Financeiro"
          description="Recebido no período não é o mesmo que faturamento"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/app/finance">Contas a receber</Link>
            </Button>
          }
        >
          <MetricList
            items={[
              {
                label: "Recebido",
                value: `${formatMoneyBRL(data.finance.received)} · ${data.finance.receivedCount} pagamento(s)`,
              },
              {
                label: "Vencido",
                value: `${formatMoneyBRL(data.finance.overdue)} · ${data.finance.overdueCount} parcela(s)`,
              },
              {
                label: "Saldo em contas",
                value: `${formatMoneyBRL(data.finance.receivableRemaining)} · ${data.finance.receivableCount} conta(s)`,
              },
            ]}
          />
          {data.finance.overdue > 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              <Badge variant="destructive" className="mr-2 align-middle">
                Atenção
              </Badge>
              {formatMoneyBRL(data.finance.overdue)} vencido em {data.finance.overdueCount}{" "}
              parcela(s).
            </p>
          ) : null}
        </SectionCard>
      ) : null}

      {data.inventory ? (
        <SectionCard
          title="Estoque"
          description="Posição atual, valor pelo custo cadastrado"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/app/inventory">Abrir estoque</Link>
            </Button>
          }
        >
          <MetricList
            items={[
              { label: "Com saldo", value: data.inventory.inStock },
              { label: "Abaixo do mínimo", value: data.inventory.belowMinimum },
              { label: "Sem estoque", value: data.inventory.outOfStock },
              {
                label: "Valor estimado",
                value: formatMoneyBRL(data.inventory.estimatedValue),
              },
            ]}
          />
        </SectionCard>
      ) : null}

      {data.purchases ? (
        <SectionCard
          title="Compras"
          description="Somente compras recebidas entram no valor"
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/app/purchases">Abrir compras</Link>
            </Button>
          }
        >
          <MetricList
            items={[
              {
                label: "Recebidas",
                value: data.purchases.countChange
                  ? `${data.purchases.count} · ${data.purchases.countChange.label}`
                  : data.purchases.count,
              },
              {
                label: "Valor comprado",
                value: data.purchases.valueChange
                  ? `${formatMoneyBRL(data.purchases.value)} · ${data.purchases.valueChange.label}`
                  : formatMoneyBRL(data.purchases.value),
              },
              { label: "Fornecedores ativos", value: data.purchases.activeSuppliers },
              { label: "Canceladas", value: data.purchases.cancelled },
            ]}
          />
          <div className="mt-5">
            <MoneyBarList
              compact
              empty="Nenhuma compra recebida no período selecionado."
              items={data.purchases.series.map((row) => ({
                key: row.key,
                label: row.label,
                value: row.revenue,
                hint: `${row.count} compra(s)`,
              }))}
            />
          </div>
          {data.purchases.recent.length === 0 ? (
            <div className="mt-3">
              <EmptyBlock compact>Nenhuma compra recente no período.</EmptyBlock>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {data.purchases.recent.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-2 text-sm">
                  <span>
                    {formatPurchaseNumber(item.number)} · {item.supplierName}
                  </span>
                  <span className="text-slate-500">
                    {item.receivedAt ? formatDateBR(item.receivedAt) : "—"} ·{" "}
                    {formatMoneyBRL(item.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      ) : null}
    </PageContainer>
  );
}
