import Link from "next/link";
import { Layers, Package } from "lucide-react";
import type { Product, ProductStatus, ProductType } from "@prisma/client";
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  formatMoneyBRL,
} from "@/modules/products/lib/product-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utilities/cn";

type ProductRow = Product & {
  category: { id: string; name: string } | null;
  inventory?: { quantity: number; minimumQuantity: number } | null;
};

function statusVariant(status: ProductStatus) {
  return status === "ACTIVE" ? ("default" as const) : ("secondary" as const);
}

function typeBadgeVariant(type: ProductType) {
  return type === "SERVICE" ? ("secondary" as const) : ("outline" as const);
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
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Nenhum produto encontrado.
        {canManage ? (
          <>
            {" "}
            <Link
              href="/app/products/new"
              className="text-[var(--bos-primary)] hover:underline"
            >
              Criar o primeiro
            </Link>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Nome
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
              SKU
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tipo
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Categoria
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Preço
            </th>
            <th className="hidden px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Estoque
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((product) => {
            const stock = product.inventory?.quantity;
            const minStock = product.inventory?.minimumQuantity ?? 0;
            const isService = product.type === "SERVICE";
            return (
              <tr
                key={product.id}
                className="transition-colors hover:bg-slate-50"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        isService
                          ? "bg-violet-50 text-violet-500"
                          : "bg-blue-50 text-blue-500",
                      )}
                    >
                      {isService ? (
                        <Layers className="size-3.5" aria-hidden />
                      ) : (
                        <Package className="size-3.5" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/app/products/${product.id}`}
                        className="text-sm font-semibold text-slate-800 hover:text-[var(--bos-primary)]"
                      >
                        {product.name}
                      </Link>
                      {product.barcode ? (
                        <div className="text-xs text-slate-400">{product.barcode}</div>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3.5 md:table-cell">
                  <span className="font-mono text-xs text-slate-500">{product.sku}</span>
                </td>
                <td className="px-4 py-3.5">
                  <Badge variant={typeBadgeVariant(product.type)}>
                    {PRODUCT_TYPE_LABELS[product.type]}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3.5 text-xs text-slate-500 lg:table-cell">
                  {product.category?.name ?? "—"}
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-800">
                  {formatMoneyBRL(product.salePrice)}
                </td>
                <td className="hidden px-4 py-3.5 text-center lg:table-cell">
                  {isService ? (
                    <span className="text-xs text-slate-300">—</span>
                  ) : stock != null ? (
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        stock === 0
                          ? "text-red-500"
                          : minStock > 0 && stock <= minStock
                            ? "text-amber-500"
                            : "text-slate-700",
                      )}
                    >
                      {stock}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <Badge variant={statusVariant(product.status)}>
                    {PRODUCT_STATUS_LABELS[product.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-right">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
