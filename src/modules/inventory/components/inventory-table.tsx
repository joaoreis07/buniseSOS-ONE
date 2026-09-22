import Link from "next/link";
import type { Product } from "@prisma/client";
import {
  STOCK_LEVEL_LABELS,
  formatMoneyBRL,
  type StockLevel,
} from "@/modules/inventory/lib/inventory-labels";
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

type InventoryRow = {
  product: Product & { category: { id: string; name: string } | null };
  quantity: number;
  minimumQuantity: number;
  stockLevel: StockLevel;
};

function stockVariant(level: StockLevel) {
  if (level === "out") return "destructive" as const;
  if (level === "low") return "secondary" as const;
  return "default" as const;
}

export function InventoryTable({ items }: { items: InventoryRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Nenhum produto físico encontrado com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead className="hidden sm:table-cell">SKU</TableHead>
            <TableHead className="hidden md:table-cell">Categoria</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead className="hidden lg:table-cell">Mínimo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.product.id}>
              <TableCell>
                <div className="font-medium">{row.product.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatMoneyBRL(row.product.costPrice)} custo
                </div>
              </TableCell>
              <TableCell className="hidden font-mono text-xs sm:table-cell">
                {row.product.sku}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {row.product.category?.name ?? "—"}
              </TableCell>
              <TableCell className="font-semibold">{row.quantity}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {row.minimumQuantity}
              </TableCell>
              <TableCell>
                <Badge variant={stockVariant(row.stockLevel)}>
                  {STOCK_LEVEL_LABELS[row.stockLevel]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/app/inventory/${row.product.id}`}>Ver</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function InventorySummaryCards({
  summary,
}: {
  summary: {
    productCount: number;
    withStock: number;
    lowStock: number;
    outOfStock: number;
    totalQuantity: number;
    totalValue: number;
  };
}) {
  const cards = [
    { label: "Produtos físicos", value: summary.productCount },
    { label: "Com registro de estoque", value: summary.withStock },
    { label: "Estoque baixo", value: summary.lowStock },
    { label: "Sem estoque", value: summary.outOfStock },
    { label: "Quantidade total", value: summary.totalQuantity },
    {
      label: "Valor (custo)",
      value: formatMoneyBRL(summary.totalValue),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-md border px-3 py-3">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {card.label}
          </p>
          <p className="mt-1 text-xl font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
