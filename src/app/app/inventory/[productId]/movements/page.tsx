import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  getInventoryProductForTenant,
  getMovementsForTenant,
} from "@/modules/inventory/services/inventory.service";
import { MovementsList } from "@/modules/inventory/components/movements-list";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default async function InventoryMovementsPage({
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

  const movements = await getMovementsForTenant({
    companyId: user.companyId,
    role: user.role,
    productId,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Histórico de movimentações
          </h1>
          <p className="text-muted-foreground">{product.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/app/inventory/${productId}`}>Voltar ao produto</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/inventory">Estoque</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{movements.length} movimentação(ões)</CardTitle>
        </CardHeader>
        <CardContent>
          <MovementsList items={movements} />
        </CardContent>
      </Card>
    </div>
  );
}
