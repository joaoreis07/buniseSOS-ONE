import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { getCustomerFormMeta } from "@/modules/crm/services/customer.service";
import { CustomerForm } from "@/modules/crm/components/customer-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function NewCustomerPage() {
  const user = await requirePermission("crm:manage");
  const meta = await getCustomerFormMeta(user.companyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Novo cliente</h1>
          <p className="text-muted-foreground">
            Cadastro vinculado à empresa da sessão
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/crm">Voltar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm mode="create" owners={meta.owners} />
        </CardContent>
      </Card>
    </div>
  );
}
