import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  canManageCustomers,
  getCustomerForTenant,
} from "@/modules/crm/services/customer.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { DeleteCustomerButton } from "@/modules/crm/components/delete-customer-button";
import { EntityActivitiesPanel } from "@/modules/crm/components/entity-activities-panel";
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_TYPE_LABELS,
  formatDocument,
  formatPhone,
} from "@/modules/crm/lib/customer-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { prisma } from "@/shared/db/prisma";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("crm:view");
  const { id } = await params;
  const customer = await getCustomerForTenant({
    companyId: user.companyId,
    role: user.role,
    customerId: id,
  });
  if (!customer) {
    notFound();
  }

  const canManage = canManageCustomers(user.role);
  const history = await prisma.auditLog.findMany({
    where: {
      companyId: user.companyId,
      entity: "Customer",
      entityId: customer.id,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      action: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  const address = [
    customer.street,
    customer.number,
    customer.complement,
    customer.district,
    customer.city,
    customer.state,
    customer.zipCode,
    customer.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <CrmSubnav role={user.role} active="customers" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {customer.name}
            </h1>
            <Badge>{CUSTOMER_STATUS_LABELS[customer.status]}</Badge>
            <Badge variant="secondary">
              {CUSTOMER_TYPE_LABELS[customer.type]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {customer.tradeName || "Ficha do cliente"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/crm">Voltar</Link>
          </Button>
          {canManage ? (
            <>
              <Button asChild>
                <Link href={`/app/crm/${customer.id}/edit`}>Editar</Link>
              </Button>
              <DeleteCustomerButton customerId={customer.id} />
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
            <CardDescription>Identificação e status</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Nome" value={customer.name} />
              <DetailItem label="Nome fantasia" value={customer.tradeName} />
              <DetailItem
                label="CPF/CNPJ"
                value={formatDocument(customer.document)}
              />
              <DetailItem label="Origem" value={customer.origin} />
              <DetailItem
                label="Responsável"
                value={
                  customer.owner?.name ?? customer.owner?.email ?? "—"
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="E-mail" value={customer.email} />
              <DetailItem label="Telefone" value={formatPhone(customer.phone)} />
              <DetailItem label="Celular" value={formatPhone(customer.mobile)} />
              <DetailItem
                label="WhatsApp"
                value={formatPhone(customer.whatsapp)}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{address || "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {customer.notes || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <EntityActivitiesPanel user={user} customerId={customer.id} />

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>
            Auditoria e eventos do cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem eventos registrados ainda.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="font-medium">{item.action}</span>
                    {" · "}
                    {item.user?.name ?? item.user?.email ?? "Sistema"}
                  </span>
                  <span className="text-muted-foreground">
                    {item.createdAt.toLocaleString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
