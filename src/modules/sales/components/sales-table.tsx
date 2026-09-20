import Link from "next/link";
import type { PaymentMethod, Sale, SaleStatus } from "@prisma/client";
import {
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
  formatDateTimeBR,
  formatMoneyBRL,
} from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  DataTableShell,
  EmptyState,
  StatCard,
} from "@/shared/components/page-layout";

type SaleRow = Sale & {
  customer: { id: string; name: string } | null;
  seller: { id: string; name: string | null; email: string } | null;
  _count: { items: number };
};

function statusVariant(status: SaleStatus) {
  if (status === "COMPLETED") return "default" as const;
  if (status === "CANCELLED") return "destructive" as const;
  return "secondary" as const;
}

export function SalesTable({ items }: { items: SaleRow[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhuma venda encontrada"
        description="Ajuste os filtros ou registre a primeira venda da empresa."
        action={
          <Button asChild>
            <Link href="/app/sales/new">Registrar venda</Link>
          </Button>
        }
      />
    );
  }

  return (
    <DataTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº</TableHead>
            <TableHead className="hidden sm:table-cell">Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden md:table-cell">Vendedor</TableHead>
            <TableHead className="hidden lg:table-cell">Itens</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="hidden md:table-cell">Pagamento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-mono text-xs">
                {formatSaleNumber(sale.number)}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-xs">
                {formatDateTimeBR(sale.completedAt ?? sale.createdAt)}
              </TableCell>
              <TableCell>{sale.customer?.name ?? "Sem cliente"}</TableCell>
              <TableCell className="hidden md:table-cell">
                {sale.seller?.name ?? sale.seller?.email ?? "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {sale._count.items}
              </TableCell>
              <TableCell>{formatMoneyBRL(sale.total)}</TableCell>
              <TableCell className="hidden md:table-cell">
                {PAYMENT_METHOD_LABELS[sale.paymentMethod as PaymentMethod]}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(sale.status)}>
                  {SALE_STATUS_LABELS[sale.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/app/sales/${sale.id}`}>Ver</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableShell>
  );
}

export function SalesKpis({
  kpis,
}: {
  kpis: {
    todayCount: number;
    todayRevenue: number;
    monthCount: number;
    monthRevenue: number;
    todayTicket: number;
    monthTicket: number;
  };
}) {
  const cards = [
    { label: "Vendas hoje", value: kpis.todayCount },
    { label: "Faturamento hoje", value: formatMoneyBRL(kpis.todayRevenue) },
    { label: "Vendas no mês", value: kpis.monthCount },
    { label: "Faturamento no mês", value: formatMoneyBRL(kpis.monthRevenue) },
    { label: "Ticket médio hoje", value: formatMoneyBRL(kpis.todayTicket) },
    { label: "Ticket médio no mês", value: formatMoneyBRL(kpis.monthTicket) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <StatCard key={card.label} label={card.label} value={card.value} />
      ))}
    </div>
  );
}
