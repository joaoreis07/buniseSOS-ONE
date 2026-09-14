import Link from "next/link";
import type { Purchase, PurchaseStatus } from "@prisma/client";
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
import { formatDateTimeBR, formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import {
  formatPurchaseNumber,
  PURCHASE_STATUS_LABELS,
} from "@/modules/purchases/lib/purchase-labels";

type PurchaseRow = Purchase & {
  supplier: { id: string; name: string } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  _count: { items: number };
};

function statusVariant(status: PurchaseStatus) {
  if (status === "RECEIVED") return "default" as const;
  if (status === "CANCELLED") return "destructive" as const;
  return "secondary" as const;
}

export function PurchaseKpis({
  kpis,
}: {
  kpis: {
    monthCount: number;
    monthValue: number;
    receivedCount: number;
    cancelledCount: number;
  };
}) {
  const cards = [
    ["Compras no mês", String(kpis.monthCount)],
    ["Valor recebido", formatMoneyBRL(kpis.monthValue)],
    ["Recebidas", String(kpis.receivedCount)],
    ["Canceladas", String(kpis.cancelledCount)],
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(([title, value]) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{value}</CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PurchasesTable({ items }: { items: PurchaseRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma compra encontrada.{" "}
        <Link href="/app/purchases/new" className="text-emerald-700 underline">
          Registrar a primeira
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº</TableHead>
            <TableHead className="hidden sm:table-cell">Data</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead className="hidden md:table-cell">Responsável</TableHead>
            <TableHead className="hidden lg:table-cell">Itens</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell className="font-mono text-xs">
                {formatPurchaseNumber(purchase.number)}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-xs">
                {formatDateTimeBR(purchase.purchasedAt)}
              </TableCell>
              <TableCell>{purchase.supplier?.name ?? "—"}</TableCell>
              <TableCell className="hidden md:table-cell">
                {purchase.createdBy?.name ?? purchase.createdBy?.email ?? "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {purchase._count.items}
              </TableCell>
              <TableCell>{formatMoneyBRL(purchase.total)}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(purchase.status)}>
                  {PURCHASE_STATUS_LABELS[purchase.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/app/purchases/${purchase.id}`}
                  className="text-sm text-emerald-700 underline"
                >
                  Ver
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
