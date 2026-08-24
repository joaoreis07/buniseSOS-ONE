import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { getSaleFormMeta } from "@/modules/sales/services/sale.service";
import { NewSaleForm } from "@/modules/sales/components/new-sale-form";
import { Button } from "@/shared/ui/button";

export default async function NewSalePage() {
  const user = await requirePermission("sales:create");
  const meta = await getSaleFormMeta(user.companyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nova venda</h1>
          <p className="text-muted-foreground">
            Totais e estoque são validados no servidor
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/sales">Voltar</Link>
        </Button>
      </div>
      <NewSaleForm products={meta.products} customers={meta.customers} />
    </div>
  );
}
