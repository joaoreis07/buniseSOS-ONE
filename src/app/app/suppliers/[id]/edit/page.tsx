import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import { getSupplierForTenant } from "@/modules/purchases/services/supplier.service";
import { SupplierForm } from "@/modules/purchases/components/supplier-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("suppliers:manage");
  const { id } = await params;
  const supplier = await getSupplierForTenant({
    companyId: user.companyId,
    role: user.role,
    supplierId: id,
  });
  if (!supplier) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar fornecedor
          </h1>
          <p className="text-muted-foreground">{supplier.name}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/app/suppliers/${supplier.id}`}>Voltar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierForm mode="edit" supplier={supplier} />
        </CardContent>
      </Card>
    </div>
  );
}
