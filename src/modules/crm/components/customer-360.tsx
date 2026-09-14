import Link from "next/link";
import type { getCustomer360 } from "@/modules/crm/repositories/customer.repository";
import { formatDateBR } from "@/modules/finance/lib/finance-labels";
import {
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
  formatMoneyBRL,
} from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

type Overview = NonNullable<Awaited<ReturnType<typeof getCustomer360>>>;

export function Customer360View({
  overview,
  sections,
}: {
  overview: Overview;
  sections: { sales: boolean; finance: boolean };
}) {
  return (
    <div className="space-y-4">
      {sections.sales && overview.sales ? (
        <Card>
          <CardHeader>
            <CardTitle>Comercial</CardTitle>
            <CardDescription>
              Somente vendas concluídas entram no total comprado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Vendas" value={overview.sales.count} />
              <Metric
                label="Total comprado"
                value={formatMoneyBRL(overview.sales.total)}
              />
              <Metric
                label="Ticket médio"
                value={formatMoneyBRL(overview.sales.ticket)}
              />
              <Metric
                label="Última compra"
                value={
                  overview.sales.lastSale
                    ? `${formatSaleNumber(overview.sales.lastSale.number)} · ${formatDateBR(overview.sales.lastSale.completedAt)}`
                    : "—"
                }
              />
            </div>
            {overview.products.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma compra registrada para este cliente.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {overview.products.map((item, index) => (
                  <li
                    key={`${item.productId}-${item.sku}`}
                    className="flex flex-col gap-1 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      {index + 1}. {item.name}{" "}
                      <span className="text-muted-foreground">· {item.sku}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {item.quantity} un. · {formatMoneyBRL(item.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      {sections.finance && overview.finance ? (
        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
            <CardDescription>
              Recebido ≠ total comprado em vendas parceladas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Total comprado"
                value={formatMoneyBRL(overview.sales?.total ?? 0)}
              />
              <Metric
                label="Recebido"
                value={formatMoneyBRL(overview.finance.received)}
              />
              <Metric
                label="Em aberto"
                value={formatMoneyBRL(overview.finance.open)}
              />
              <Metric
                label="Vencido"
                value={formatMoneyBRL(overview.finance.overdue)}
                hint={
                  overview.finance.overdueCount
                    ? `${overview.finance.overdueCount} parcela(s)`
                    : undefined
                }
              />
            </div>
            {overview.finance.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma parcela a vencer nos próximos 7 dias.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {overview.finance.upcoming.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-1 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      {formatSaleNumber(item.saleNumber)} · parcela {item.number}
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

      {sections.sales ? (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma venda concluída ou cancelada.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {overview.recentSales.map((sale) => (
                  <li
                    key={sale.id}
                    className="flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/app/sales/${sale.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {formatSaleNumber(sale.number)}
                      </Link>
                      <Badge
                        variant={
                          sale.status === "CANCELLED" ? "destructive" : "secondary"
                        }
                      >
                        {SALE_STATUS_LABELS[sale.status]}
                      </Badge>
                      <span className="text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {formatDateBR(sale.completedAt ?? sale.cancelledAt)} ·{" "}
                      {formatMoneyBRL(sale.total)}
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

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-md border px-3 py-3">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
