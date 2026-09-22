import Link from "next/link";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import {
  PURCHASE_STATUS_LABELS,
  formatPurchaseNumber,
} from "@/modules/purchases/lib/purchase-labels";
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

export function PurchasesReportTable({
  items,
}: {
  items: Array<{
    purchaseId: string;
    number: number;
    status: keyof typeof PURCHASE_STATUS_LABELS;
    supplierName: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitCost: number;
    lineTotal: number;
    purchaseTotal: number;
  }>;
}) {
  if (items.length === 0) {
    return <EmptyBlock>Nenhuma compra no período selecionado.</EmptyBlock>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Compra</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Qtd.</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row, index) => (
            <TableRow key={`${row.purchaseId}-${row.productSku}-${index}`}>
              <TableCell>
                <Link
                  href={`/app/purchases/${row.purchaseId}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {formatPurchaseNumber(row.number)}
                </Link>
                <div className="mt-1">
                  <Badge
                    variant={row.status === "CANCELLED" ? "destructive" : "secondary"}
                  >
                    {PURCHASE_STATUS_LABELS[row.status]}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>{row.supplierName}</TableCell>
              <TableCell>
                {row.productName}
                <div className="text-xs text-muted-foreground">{row.productSku}</div>
              </TableCell>
              <TableCell>{row.quantity}</TableCell>
              <TableCell>{formatMoneyBRL(row.unitCost)}</TableCell>
              <TableCell className="font-medium">
                {formatMoneyBRL(row.lineTotal)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
