import Link from "next/link";
import { PAYMENT_METHOD_LABELS, formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import {
  RECEIVABLE_STATUS_LABELS,
  formatDateBR,
} from "@/modules/finance/lib/finance-labels";
import { EmptyBlock } from "@/modules/reports/components/kpi-card";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

export function FinanceReportTable({
  items,
}: {
  items: Array<{
    id: string;
    status: keyof typeof RECEIVABLE_STATUS_LABELS;
    paymentMethod: keyof typeof PAYMENT_METHOD_LABELS;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: Date | null;
    overdue: boolean;
    customerName: string | null;
    saleId: string;
    saleNumber: number;
  }>;
}) {
  if (items.length === 0) {
    return <EmptyBlock>Nenhuma conta a receber no período selecionado.</EmptyBlock>;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Venda</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Original</TableHead>
            <TableHead>Recebido</TableHead>
            <TableHead>Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link
                  href={`/app/finance/${row.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {formatSaleNumber(row.saleNumber)}
                </Link>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant={row.overdue ? "destructive" : "secondary"}>
                    {RECEIVABLE_STATUS_LABELS[row.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {PAYMENT_METHOD_LABELS[row.paymentMethod]}
                  </span>
                </div>
              </TableCell>
              <TableCell>{row.customerName ?? "—"}</TableCell>
              <TableCell>
                {formatDateBR(row.dueDate)}
                {row.overdue ? (
                  <div className="text-xs text-destructive">Vencido</div>
                ) : null}
              </TableCell>
              <TableCell>{formatMoneyBRL(row.totalAmount)}</TableCell>
              <TableCell>{formatMoneyBRL(row.paidAmount)}</TableCell>
              <TableCell className="font-medium">
                {formatMoneyBRL(row.remainingAmount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
