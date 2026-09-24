import Link from "next/link";
import { Calendar, DollarSign, Target, UserPlus, Users } from "lucide-react";
import { CrmFunnelChart } from "@/modules/reports/components/dashboard-charts-dynamic";
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPE_LABELS,
} from "@/modules/crm/lib/activity-labels";
import {
  OPPORTUNITY_STAGE_LABELS,
  formatMoneyBRL,
} from "@/modules/crm/lib/opportunity-labels";
import type { getCrmDashboard } from "@/modules/crm/services/crm-dashboard.service";
import { SectionCard, StatCard } from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";

type CrmDashboardData = Awaited<ReturnType<typeof getCrmDashboard>>;

export function CrmDashboardView({ data }: { data: CrmDashboardData }) {
  const funnelData = data.opportunitiesByStage
    .filter((row) => !["WON", "LOST"].includes(row.stage))
    .map((row) => ({
      stage: OPPORTUNITY_STAGE_LABELS[row.stage],
      count: row.count,
    }));

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Clientes ativos"
          value={data.activeCustomers}
          icon={Users}
          tone="blue"
        />
        <StatCard label="Leads" value={data.leads.total} icon={UserPlus} tone="green" />
        <StatCard
          label="Oportunidades"
          value={data.opportunities.open}
          icon={Target}
          tone="blue"
        />
        <StatCard
          label="Valor em aberto"
          value={formatMoneyBRL(data.opportunities.pipelineValue)}
          icon={DollarSign}
          tone="amber"
        />
        <StatCard
          label="Atividades pendentes"
          value={data.activities.pending}
          icon={Calendar}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Funil de vendas</h3>
          <CrmFunnelChart data={funnelData} />
        </div>

        <SectionCard title="Atividades recentes">
          {data.recentActivities.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-slate-400">
              Nenhuma atividade registrada.
            </p>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/app/crm/activities/${activity.id}`}
                      className="truncate text-xs font-semibold text-slate-800 hover:text-[var(--bos-primary)]"
                    >
                      {activity.title}
                    </Link>
                    <div className="text-xs text-slate-400">
                      {ACTIVITY_TYPE_LABELS[activity.type]} ·{" "}
                      {activity.customer?.name ?? activity.lead?.name ?? "—"}
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-3 shrink-0">
                    {ACTIVITY_STATUS_LABELS[activity.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
