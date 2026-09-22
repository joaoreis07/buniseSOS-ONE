import Link from "next/link";
import type { Product, ProductStatus } from "@prisma/client";
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  formatMoneyBRL,
} from "@/modules/products/lib/product-labels";
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

type ProductRow = Product & {
  category: { id: string; name: string } | null;
};

function statusVariant(status: ProductStatus) {
  return status === "ACTIVE" ? ("default" as const) : ("secondary" as const);
}

export function ProductsTable({
  items,
  canManage,
}: {
  items: ProductRow[];
  canManage: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Nenhum produto encontrado.
        {canManage ? (
          <>
            {" "}
            <Link
              href="/app/products/new"
              className="text-emerald-700 underline"
            >
              Criar o primeiro
            </Link>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden sm:table-cell">SKU</TableHead>
            <TableHead className="hidden md:table-cell">Tipo</TableHead>
            <TableHead className="hidden lg:table-cell">Categoria</TableHead>
            <TableHead className="hidden md:table-cell">Venda</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="font-medium">{product.name}</div>
                {product.barcode ? (
                  <div className="text-xs text-muted-foreground">
                    {product.barcode}
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="hidden sm:table-cell font-mono text-xs">
                {product.sku}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {PRODUCT_TYPE_LABELS[product.type]}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {product.category?.name ?? "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatMoneyBRL(product.salePrice)}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(product.status)}>
                  {PRODUCT_STATUS_LABELS[product.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/app/products/${product.id}`}>Ver</Link>
                  </Button>
                  {canManage ? (
                    <Button asChild size="sm">
                      <Link href={`/app/products/${product.id}/edit`}>
                        Editar
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
