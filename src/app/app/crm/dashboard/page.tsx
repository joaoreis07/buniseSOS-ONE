import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { getCrmDashboard } from "@/modules/crm/services/crm-dashboard.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import {
  OPPORTUNITY_STAGE_LABELS,
  formatMoneyBRL,
} from "@/modules/crm/lib/opportunity-labels";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
    </div>
  );
}

export default async function CrmDashboardPage() {
  const user = await requirePermission("crm:dashboard:view");
  const data = await getCrmDashboard({
    companyId: user.companyId,
    role: user.role,
  });

  return (
    <PageContainer>
      <CrmSubnav role={user.role} active="dashboard" />
      <PageHeader
        eyebrow="CRM"
        title="Dashboard CRM"
        description="Indicadores de leads, pipeline, conversões e atividades."
        actions={
          <>
          <Button asChild variant="outline">
            <Link href="/app/crm/pipeline">Funil</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/crm/activities">Atividades</Link>
          </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total" value={data.leads.total} />
          <Metric label="Novos" value={data.leads.new} />
          <Metric label="Convertidos" value={data.leads.converted} />
          <Metric label="Perdidos" value={data.leads.lost} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Oportunidades</CardTitle>
          <CardDescription>
            Pipeline aberto: {formatMoneyBRL(data.opportunities.pipelineValue)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total" value={data.opportunities.total} />
          <Metric label="Abertas" value={data.opportunities.open} />
          <Metric label="Ganhas" value={data.opportunities.won} />
          <Metric label="Perdidas" value={data.opportunities.lost} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversão</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Metric
              label="Leads → oportunidades"
              value={`${data.conversion.leadToOpportunityRate}%`}
            />
            <Metric
              label="Oportunidades → ganhos"
              value={`${data.conversion.opportunityWinRate}%`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Metric label="Pendentes" value={data.activities.pending} />
            <Metric label="Concluídas" value={data.activities.completed} />
            <Metric label="Atrasadas" value={data.activities.overdue} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por estágio</CardTitle>
            <CardDescription>Quantidade e valor</CardDescription>
          </CardHeader>
          <CardContent>
            {data.opportunitiesByStage.every((row) => row.count === 0) ? (
              <p className="text-sm text-muted-foreground">
                Sem oportunidades no período.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.opportunitiesByStage.map((row) => (
                  <li
                    key={row.stage}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span>{OPPORTUNITY_STAGE_LABELS[row.stage]}</span>
                    <span className="text-muted-foreground">
                      {row.count} · {formatMoneyBRL(row.value)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desempenho por responsável</CardTitle>
            <CardDescription>Oportunidades abertas</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byOwner.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem membros no tenant.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.byOwner.map((row) => (
                  <li
                    key={row.ownerId}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span>{row.name}</span>
                    <span className="text-muted-foreground">
                      {row.count} · {formatMoneyBRL(row.value)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
