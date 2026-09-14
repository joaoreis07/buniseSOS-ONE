import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  getPurchaseForTenant,
  getPurchaseFormMeta,
} from "@/modules/purchases/services/purchase.service";
import { PurchaseForm } from "@/modules/purchases/components/purchase-form";
import { Button } from "@/shared/ui/button";

export default async function EditPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("purchases:create");
  const { id } = await params;
  const [purchase, meta] = await Promise.all([
    getPurchaseForTenant({
      companyId: user.companyId,
      role: user.role,
      purchaseId: id,
    }),
    getPurchaseFormMeta(user.companyId),
  ]);
  if (!purchase) notFound();
  if (purchase.status !== "DRAFT") notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar compra
          </h1>
          <p className="text-muted-foreground">Somente rascunhos</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/app/purchases/${purchase.id}`}>Voltar</Link>
        </Button>
      </div>
      <PurchaseForm
        mode="edit"
        purchaseId={purchase.id}
        products={meta.products}
        suppliers={meta.suppliers}
        initialSupplierId={purchase.supplierId}
        initialDiscount={String(Number(purchase.discountAmount))}
        initialNotes={purchase.notes ?? ""}
        initialLines={purchase.items.map((item) => ({
          productId: item.productId,
          name: item.productName,
          sku: item.productSku,
          unitCost: Number(item.unitCost),
          quantity: item.quantity,
        }))}
      />
    </div>
  );
}
