import Link from "next/link";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import {
  formatDateBR,
  RECEIVABLE_STATUS_LABELS,
} from "@/modules/finance/lib/finance-labels";

export function FinanceKpis({
  kpis,
}: {
  kpis: {
    openAmount: unknown;
    overdueAmount: unknown;
    receivedAmount: unknown;
  };
}) {
  const cards = [
    ["Em aberto", kpis.openAmount],
    ["Vencido", kpis.overdueAmount],
    ["Recebido (quitadas)", kpis.receivedAmount],
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map(([title, value]) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoneyBRL(value)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FinanceTable({
  items,
}: {
  items: Array<{
    id: string;
    status: keyof typeof RECEIVABLE_STATUS_LABELS;
    totalAmount: unknown;
    paidAmount: unknown;
    remainingAmount: unknown;
    dueDate: Date | null;
    customer: { id: string; name: string } | null;
    sale: { id: string; number: number; status: string };
  }>;
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Venda</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead>Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-muted-foreground"
              >
                Nenhuma conta a receber encontrada.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    className="text-emerald-700 underline"
                    href={`/app/finance/${item.id}`}
                  >
                    {formatSaleNumber(item.sale.number)}
                  </Link>
                </TableCell>
                <TableCell>{item.customer?.name ?? "Sem cliente"}</TableCell>
                <TableCell>
                  <Badge>{RECEIVABLE_STATUS_LABELS[item.status]}</Badge>
                </TableCell>
                <TableCell>{formatDateBR(item.dueDate)}</TableCell>
                <TableCell>{formatMoneyBRL(item.totalAmount)}</TableCell>
                <TableCell>{formatMoneyBRL(item.paidAmount)}</TableCell>
                <TableCell className="font-medium">
                  {formatMoneyBRL(item.remainingAmount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
