import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  canManageLeads,
  getLeadForTenant,
} from "@/modules/crm/services/lead.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { DeleteLeadButton } from "@/modules/crm/components/delete-lead-button";
import { EntityActivitiesPanel } from "@/modules/crm/components/entity-activities-panel";
import {
  LEAD_ORIGIN_LABELS,
  LEAD_STATUS_LABELS,
  formatMoneyBRL,
} from "@/modules/crm/lib/lead-labels";
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

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("crm:leads:view");
  const { id } = await params;
  const lead = await getLeadForTenant({
    companyId: user.companyId,
    role: user.role,
    leadId: id,
  });
  if (!lead) {
    notFound();
  }

  const canManage = canManageLeads(user.role);
  const history = await prisma.auditLog.findMany({
    where: {
      companyId: user.companyId,
      entity: "Lead",
      entityId: lead.id,
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

  return (
    <div className="space-y-6">
      <CrmSubnav role={user.role} active="leads" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{lead.name}</h1>
            <Badge>{LEAD_STATUS_LABELS[lead.status]}</Badge>
            <Badge variant="secondary">{LEAD_ORIGIN_LABELS[lead.origin]}</Badge>
          </div>
          <p className="text-muted-foreground">
            {lead.companyName || "Ficha do lead"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/crm/leads">Voltar</Link>
          </Button>
          {canManage ? (
            <>
              <Button asChild>
                <Link href={`/app/crm/leads/${lead.id}/edit`}>Editar</Link>
              </Button>
              <DeleteLeadButton leadId={lead.id} />
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Nome" value={lead.name} />
              <DetailItem label="Empresa" value={lead.companyName} />
              <DetailItem
                label="Valor estimado"
                value={formatMoneyBRL(lead.estimatedValue)}
              />
              <DetailItem
                label="Responsável"
                value={lead.owner?.name ?? lead.owner?.email ?? "—"}
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
              <DetailItem label="E-mail" value={lead.email} />
              <DetailItem label="Telefone" value={lead.phone} />
              <DetailItem label="WhatsApp" value={lead.whatsapp} />
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{lead.notes || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <EntityActivitiesPanel user={user} leadId={lead.id} />

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>Auditoria e eventos do lead</CardDescription>
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
