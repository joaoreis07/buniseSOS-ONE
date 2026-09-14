import Link from "next/link";
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
import { EmptyBlock, KpiCard } from "@/modules/reports/components/kpi-card";
import type { getDashboardForTenant } from "@/modules/reports/services/dashboard.service";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

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
    sections.sales ||
    sections.finance ||
    sections.inventory ||
    sections.purchases;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {PERIOD_PRESET_LABELS[range.preset]} · {formatCivilDate(range.start)}{" "}
            até {formatCivilDate(range.end)}
          </p>
        </div>
        {canViewReports ? (
          <Button asChild variant="outline">
            <Link href="/app/reports">Relatórios</Link>
          </Button>
        ) : null}
      </div>

      <PeriodFilter action="/app" range={range} />

      {!hasAny ? (
        <EmptyBlock>
          Nenhum indicador disponível para o seu perfil.
        </EmptyBlock>
      ) : null}

      {data.sales ? (
        <Card>
          <CardHeader>
            <CardTitle>Vendas</CardTitle>
            <CardDescription>
              Somente vendas concluídas entram no faturamento. Parcelado continua
              sendo venda mesmo sem recebimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Vendas"
              value={data.sales.count}
              change={data.sales.countChange}
              hint="vs. período anterior"
            />
            <KpiCard
              label="Faturamento"
              value={formatMoneyBRL(data.sales.revenue)}
              change={data.sales.revenueChange}
            />
            <KpiCard
              label="Ticket médio"
              value={formatMoneyBRL(data.sales.ticket)}
              change={data.sales.ticketChange}
            />
            <KpiCard
              label="Canceladas"
              value={data.sales.cancelled}
              hint="fora do faturamento"
            />
          </CardContent>
        </Card>
      ) : null}

      {sections.sales ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento no período</CardTitle>
              <CardDescription>
                Agrupado por{" "}
                {range.group === "day"
                  ? "dia"
                  : range.group === "week"
                    ? "semana"
                    : "mês"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MoneyBarList
                empty="Nenhuma venda no período selecionado."
                items={data.chart.map((row) => ({
                  key: row.key,
                  label: row.label,
                  value: row.revenue,
                  hint: `${row.count} venda(s)`,
                }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Forma de pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <MoneyBarList
                empty="Nenhuma venda no período selecionado."
                items={data.payments.map((row) => ({
                  key: row.paymentMethod,
                  label: PAYMENT_METHOD_LABELS[row.paymentMethod],
                  value: row.revenue,
                  hint: `${row.count} venda(s)`,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {sections.sales ? (
        <Card>
          <CardHeader>
            <CardTitle>Vendas por produto</CardTitle>
            <CardDescription>Ranking por faturamento no período</CardDescription>
          </CardHeader>
          <CardContent>
            {data.products.length === 0 ? (
              <EmptyBlock>Nenhuma venda no período selecionado.</EmptyBlock>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.products.map((row, index) => (
                  <li
                    key={`${row.productId}-${row.sku}`}
                    className="flex flex-col gap-1 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      {index + 1}. {row.name}{" "}
                      <span className="text-muted-foreground">
                        · {PRODUCT_TYPE_LABELS[row.type]} · {row.sku}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {row.quantity} un. · {formatMoneyBRL(row.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {data.finance ? (
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Financeiro</CardTitle>
              <CardDescription>
                Recebido no período ≠ faturamento de vendas
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/finance">Contas a receber</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Recebido no período"
                value={formatMoneyBRL(data.finance.received)}
                hint={`${data.finance.receivedCount} pagamento(s)`}
              />
              <KpiCard
                label="Em aberto"
                value={formatMoneyBRL(data.finance.open)}
                hint={`${data.finance.openCount} parcela(s)`}
              />
              <KpiCard
                label="Vencido"
                value={formatMoneyBRL(data.finance.overdue)}
                hint={`${data.finance.overdueCount} parcela(s)`}
              />
              <KpiCard
                label="Contas a receber"
                value={formatMoneyBRL(data.finance.receivableRemaining)}
                hint={`${data.finance.receivableCount} conta(s)`}
              />
            </div>
            {data.finance.upcoming.length === 0 ? (
              <EmptyBlock>Nenhum vencimento nos próximos 7 dias.</EmptyBlock>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.finance.upcoming.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-1 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      {formatSaleNumber(item.saleNumber)} · parcela {item.number}{" "}
                      · {item.customerName ?? "Sem cliente"}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDateBR(item.dueDate)} ·{" "}
                      {formatMoneyBRL(item.remainingAmount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {data.inventory ? (
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Estoque</CardTitle>
              <CardDescription>
                Snapshot atual · valor estimado pelo custo cadastrado
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/inventory">Abrir estoque</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Produtos em estoque"
                value={data.inventory.inStock}
              />
              <KpiCard
                label="Abaixo do mínimo"
                value={data.inventory.belowMinimum}
              />
              <KpiCard
                label="Sem estoque"
                value={data.inventory.outOfStock}
              />
              <KpiCard
                label="Valor estimado"
                value={formatMoneyBRL(data.inventory.estimatedValue)}
              />
            </div>
            {data.inventory.alerts.length === 0 ? (
              <EmptyBlock>Nenhum alerta de estoque crítico.</EmptyBlock>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.inventory.alerts.map((item) => (
                  <li
                    key={item.productId}
                    className="flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      {item.name}{" "}
                      <span className="text-muted-foreground">· {item.sku}</span>
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {item.quantity} / mín. {item.minimumQuantity}
                      <Badge
                        variant={
                          item.stockLevel === "out" ? "destructive" : "secondary"
                        }
                      >
                        {STOCK_LEVEL_LABELS[item.stockLevel]}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {data.purchases ? (
        <Card>
          <CardHeader>
            <CardTitle>Compras</CardTitle>
            <CardDescription>
              Somente compras recebidas entram no valor comprado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Compras recebidas"
                value={data.purchases.count}
                change={data.purchases.countChange}
              />
              <KpiCard
                label="Valor comprado"
                value={formatMoneyBRL(data.purchases.value)}
                change={data.purchases.valueChange}
              />
              <KpiCard
                label="Fornecedores ativos"
                value={data.purchases.activeSuppliers}
              />
              <KpiCard
                label="Canceladas"
                value={data.purchases.cancelled}
                hint="fora do valor comprado"
              />
            </div>
            <MoneyBarList
              empty="Nenhuma compra recebida no período selecionado."
              items={data.purchases.series.map((row) => ({
                key: row.key,
                label: row.label,
                value: row.revenue,
                hint: `${row.count} compra(s)`,
              }))}
            />
            {data.purchases.recent.length === 0 ? (
              <EmptyBlock>Nenhuma compra recente no período.</EmptyBlock>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.purchases.recent.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-1 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      {formatPurchaseNumber(item.number)} · {item.supplierName}
                    </span>
                    <span className="text-muted-foreground">
                      {item.receivedAt ? formatDateBR(item.receivedAt) : "—"} ·{" "}
                      {formatMoneyBRL(item.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
