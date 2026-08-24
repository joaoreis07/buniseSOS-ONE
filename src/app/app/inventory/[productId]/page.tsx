import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  canManageInventory,
  canRegisterMovements,
  getInventoryProductForTenant,
  getMovementsForTenant,
} from "@/modules/inventory/services/inventory.service";
import { MovementForm } from "@/modules/inventory/components/movement-form";
import { MinimumQuantityForm } from "@/modules/inventory/components/minimum-quantity-form";
import { MovementsList } from "@/modules/inventory/components/movements-list";
import {
  STOCK_LEVEL_LABELS,
  formatMoneyBRL,
  getStockLevel,
} from "@/modules/inventory/lib/inventory-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default async function InventoryProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const user = await requirePermission("inventory:view");
  const { productId } = await params;
  const product = await getInventoryProductForTenant({
    companyId: user.companyId,
    role: user.role,
    productId,
  });
  if (!product) notFound();

  const quantity = product.inventory?.quantity ?? 0;
  const minimumQuantity = product.inventory?.minimumQuantity ?? 0;
  const stockLevel = getStockLevel({ quantity, minimumQuantity });
  const canManage = canManageInventory(user.role);
  const canMove = canRegisterMovements(user.role);

  const recentMovements = await getMovementsForTenant({
    companyId: user.companyId,
    role: user.role,
    productId,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <Badge>{STOCK_LEVEL_LABELS[stockLevel]}</Badge>
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            SKU {product.sku}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/inventory">Voltar</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/app/inventory/${productId}/movements`}>
              Histórico completo
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Saldo atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{quantity}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Valor custo: {formatMoneyBRL(quantity * Number(product.costPrice))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{product.category?.name ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Preços</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Custo: {formatMoneyBRL(product.costPrice)}</p>
            <p>Venda: {formatMoneyBRL(product.salePrice)}</p>
          </CardContent>
        </Card>
      </div>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Estoque mínimo</CardTitle>
            <CardDescription>
              Alerta quando saldo ≤ mínimo (com saldo &gt; 0)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MinimumQuantityForm
              productId={productId}
              minimumQuantity={minimumQuantity}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Estoque mínimo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{minimumQuantity}</p>
          </CardContent>
        </Card>
      )}

      {canMove ? (
        <Card>
          <CardHeader>
            <CardTitle>Nova movimentação</CardTitle>
            <CardDescription>
              Entrada, saída, ajuste, devolução ou perda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MovementForm productId={productId} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Movimentações recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <MovementsList items={recentMovements.slice(0, 10)} />
        </CardContent>
      </Card>
    </div>
  );
}
