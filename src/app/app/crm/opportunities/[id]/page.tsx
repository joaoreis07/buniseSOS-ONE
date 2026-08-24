import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  canManageOpportunities,
  getOpportunityForTenant,
} from "@/modules/crm/services/opportunity.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { DeleteOpportunityButton } from "@/modules/crm/components/delete-opportunity-button";
import { EntityActivitiesPanel } from "@/modules/crm/components/entity-activities-panel";
import {
  OPPORTUNITY_STAGE_LABELS,
  formatDateBR,
  formatMoneyBRL,
} from "@/modules/crm/lib/opportunity-labels";
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

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("crm:opportunities:view");
  const { id } = await params;
  const opportunity = await getOpportunityForTenant({
    companyId: user.companyId,
    role: user.role,
    opportunityId: id,
  });
  if (!opportunity) {
    notFound();
  }

  const canManage = canManageOpportunities(user.role);
  const history = await prisma.auditLog.findMany({
    where: {
      companyId: user.companyId,
      entity: "Opportunity",
      entityId: opportunity.id,
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
      <CrmSubnav role={user.role} active="opportunities" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {opportunity.name}
            </h1>
            <Badge>{OPPORTUNITY_STAGE_LABELS[opportunity.stage]}</Badge>
          </div>
          <p className="text-muted-foreground">
            {formatMoneyBRL(opportunity.estimatedValue)} ·{" "}
            {opportunity.probability}% · previsão{" "}
            {formatDateBR(opportunity.expectedCloseDate)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/crm/opportunities">Voltar</Link>
          </Button>
          {canManage ? (
            <>
              <Button asChild>
                <Link href={`/app/crm/opportunities/${opportunity.id}/edit`}>
                  Editar
                </Link>
              </Button>
              <DeleteOpportunityButton opportunityId={opportunity.id} />
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comercial</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Estágio" value={OPPORTUNITY_STAGE_LABELS[opportunity.stage]} />
              <DetailItem
                label="Responsável"
                value={
                  opportunity.owner?.name ?? opportunity.owner?.email ?? "—"
                }
              />
              <DetailItem
                label="Valor estimado"
                value={formatMoneyBRL(opportunity.estimatedValue)}
              />
              <DetailItem
                label="Probabilidade"
                value={`${opportunity.probability}%`}
              />
              <DetailItem
                label="Previsão"
                value={formatDateBR(opportunity.expectedCloseDate)}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vínculos</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Lead"
                value={
                  opportunity.lead ? (
                    <Link
                      href={`/app/crm/leads/${opportunity.lead.id}`}
                      className="text-emerald-700 underline"
                    >
                      {opportunity.lead.name}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <DetailItem
                label="Cliente"
                value={
                  opportunity.customer ? (
                    <Link
                      href={`/app/crm/${opportunity.customer.id}`}
                      className="text-emerald-700 underline"
                    >
                      {opportunity.customer.name}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {opportunity.notes || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <EntityActivitiesPanel user={user} opportunityId={opportunity.id} />

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>
            Auditoria e mudanças de estágio
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
