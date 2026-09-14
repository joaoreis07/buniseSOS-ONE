import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import { canManageActivities, getActivityForTenant } from "@/modules/crm/services/activity.service";
import { canSendCommunications } from "@/modules/communications/services/communication.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { ActivitiesList } from "@/modules/crm/components/activities-list";
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPE_LABELS,
  formatDateTimeBR,
} from "@/modules/crm/lib/activity-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("crm:activities:view");
  const { id } = await params;
  const activity = await getActivityForTenant({
    companyId: user.companyId,
    role: user.role,
    activityId: id,
  });
  if (!activity) notFound();
  const canManage = canManageActivities(user.role);
  const canSend =
    canSendCommunications(user.role) && Boolean(activity.customerId);

  return (
    <div className="space-y-6">
      <CrmSubnav role={user.role} active="activities" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {activity.title}
            </h1>
            <Badge>{ACTIVITY_TYPE_LABELS[activity.type]}</Badge>
            <Badge variant="secondary">
              {ACTIVITY_STATUS_LABELS[activity.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {formatDateTimeBR(activity.dueAt)} ·{" "}
            {activity.owner?.name ?? activity.owner?.email ?? "Sem responsável"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/app/crm/activities">Voltar</Link>
          </Button>
          {canSend && activity.customerId ? (
            <Button asChild variant="outline">
              <Link
                href={`/app/communications/new?customerId=${activity.customerId}&activityId=${activity.id}&intent=followup`}
              >
                WhatsApp
              </Link>
            </Button>
          ) : null}
          {canManage ? (
            <Button asChild>
              <Link href={`/app/crm/activities/${activity.id}/edit`}>
                Editar
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="whitespace-pre-wrap">{activity.description || "—"}</p>
          <p>
            Cliente:{" "}
            {activity.customer ? (
              <Link
                className="text-emerald-700 underline"
                href={`/app/crm/${activity.customer.id}`}
              >
                {activity.customer.name}
              </Link>
            ) : (
              "—"
            )}
          </p>
          <p>
            Lead:{" "}
            {activity.lead ? (
              <Link
                className="text-emerald-700 underline"
                href={`/app/crm/leads/${activity.lead.id}`}
              >
                {activity.lead.name}
              </Link>
            ) : (
              "—"
            )}
          </p>
          <p>
            Oportunidade:{" "}
            {activity.opportunity ? (
              <Link
                className="text-emerald-700 underline"
                href={`/app/crm/opportunities/${activity.opportunity.id}`}
              >
                {activity.opportunity.name}
              </Link>
            ) : (
              "—"
            )}
          </p>
        </CardContent>
      </Card>

      {canManage ? (
        <ActivitiesList items={[activity]} canManage={canManage} compact />
      ) : null}
    </div>
  );
}
