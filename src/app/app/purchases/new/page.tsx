import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { getPurchaseFormMeta } from "@/modules/purchases/services/purchase.service";
import { getOperationalDefaults } from "@/modules/settings/services/settings.service";
import { PurchaseForm } from "@/modules/purchases/components/purchase-form";
import { Button } from "@/shared/ui/button";

export default async function NewPurchasePage() {
  const user = await requirePermission("purchases:create");
  const meta = await getPurchaseFormMeta(user.companyId);
  const defaults = await getOperationalDefaults(user.companyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nova compra</h1>
          <p className="text-muted-foreground">
            Totais e estoque são validados no servidor
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/purchases">Voltar</Link>
        </Button>
      </div>
      <PurchaseForm
        mode="create"
        products={meta.products}
        suppliers={meta.suppliers}
        initialNotes={defaults.defaultPurchaseNotes ?? ""}
      />
    </div>
  );
}
