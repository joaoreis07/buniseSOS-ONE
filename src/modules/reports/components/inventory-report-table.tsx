import Link from "next/link";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import {
  STOCK_LEVEL_LABELS,
  type StockLevel,
} from "@/modules/inventory/lib/inventory-labels";
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

export function InventoryReportTable({
  items,
}: {
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    costPrice: number;
    quantity: number;
    minimumQuantity: number;
    stockLevel: StockLevel;
  }>;
}) {
  if (items.length === 0) {
    return <EmptyBlock>Nenhum produto encontrado para os filtros.</EmptyBlock>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Mínimo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Custo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.productId}>
              <TableCell>
                <Link
                  href={`/app/inventory/${row.productId}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {row.name}
                </Link>
                <div className="text-xs text-muted-foreground">{row.sku}</div>
              </TableCell>
              <TableCell>{row.quantity}</TableCell>
              <TableCell>{row.minimumQuantity}</TableCell>
              <TableCell>
                <Badge
                  variant={row.stockLevel === "out" ? "destructive" : "secondary"}
                >
                  {STOCK_LEVEL_LABELS[row.stockLevel]}
                </Badge>
              </TableCell>
              <TableCell>{formatMoneyBRL(row.costPrice)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
