import Link from "next/link";
import {
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
  formatMoneyBRL,
} from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import { formatDateBR } from "@/modules/finance/lib/finance-labels";
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

export function SalesReportTable({
  items,
}: {
  items: Array<{
    id: string;
    number: number;
    status: keyof typeof SALE_STATUS_LABELS;
    paymentMethod: keyof typeof PAYMENT_METHOD_LABELS;
    subtotal: number;
    discountAmount: number;
    total: number;
    completedAt: Date | null;
    cancelledAt: Date | null;
    customerName: string | null;
    sellerName: string;
    itemCount: number;
    itemQuantity: number;
  }>;
}) {
  if (items.length === 0) {
    return <EmptyBlock>Nenhuma venda no período selecionado.</EmptyBlock>;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Venda</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Itens</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead>Descontos</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link href={`/app/sales/${row.id}`} className="font-medium underline-offset-4 hover:underline">
                  {formatSaleNumber(row.number)}
                </Link>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge
                    variant={row.status === "CANCELLED" ? "destructive" : "secondary"}
                  >
                    {SALE_STATUS_LABELS[row.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {PAYMENT_METHOD_LABELS[row.paymentMethod]}
                  </span>
                </div>
              </TableCell>
              <TableCell>{formatDateBR(row.completedAt ?? row.cancelledAt)}</TableCell>
              <TableCell>
                <div>{row.customerName ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{row.sellerName}</div>
              </TableCell>
              <TableCell>
                {row.itemCount} · {row.itemQuantity} un.
              </TableCell>
              <TableCell>{formatMoneyBRL(row.subtotal)}</TableCell>
              <TableCell>{formatMoneyBRL(row.discountAmount)}</TableCell>
              <TableCell className="font-medium">{formatMoneyBRL(row.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
