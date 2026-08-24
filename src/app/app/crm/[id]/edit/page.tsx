import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  getCustomerForTenant,
  getCustomerFormMeta,
} from "@/modules/crm/services/customer.service";
import { CustomerForm } from "@/modules/crm/components/customer-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("crm:manage");
  const { id } = await params;
  const [customer, meta] = await Promise.all([
    getCustomerForTenant({
      companyId: user.companyId,
      role: user.role,
      customerId: id,
    }),
    getCustomerFormMeta(user.companyId),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar cliente
          </h1>
          <p className="text-muted-foreground">{customer.name}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/app/crm/${customer.id}`}>Voltar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            mode="edit"
            customer={customer}
            owners={meta.owners}
          />
        </CardContent>
      </Card>
    </div>
  );
}
