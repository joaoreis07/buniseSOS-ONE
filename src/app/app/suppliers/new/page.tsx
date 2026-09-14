import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { SupplierForm } from "@/modules/purchases/components/supplier-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function NewSupplierPage() {
  await requirePermission("suppliers:manage");
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Novo fornecedor
          </h1>
          <p className="text-muted-foreground">
            Cadastro vinculado à empresa da sessão
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/suppliers">Voltar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
