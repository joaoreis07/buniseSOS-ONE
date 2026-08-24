import Link from "next/link";
import { hasPermission } from "@/shared/permissions/rbac";
import type { AppSessionUser } from "@/shared/auth/session";
import {
  canManageActivities,
  getEntityActivities,
} from "@/modules/crm/services/activity.service";
import { ActivitiesList } from "@/modules/crm/components/activities-list";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export async function EntityActivitiesPanel({
  user,
  customerId,
  leadId,
  opportunityId,
}: {
  user: AppSessionUser;
  customerId?: string;
  leadId?: string;
  opportunityId?: string;
}) {
  if (!hasPermission(user.role, "crm:activities:view")) {
    return null;
  }

  const items = await getEntityActivities({
    companyId: user.companyId,
    role: user.role,
    customerId,
    leadId,
    opportunityId,
  });
  const canManage = canManageActivities(user.role);

  const params = new URLSearchParams();
  if (customerId) params.set("customerId", customerId);
  if (leadId) params.set("leadId", leadId);
  if (opportunityId) params.set("opportunityId", opportunityId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Atividades</CardTitle>
          <CardDescription>Follow-ups e tarefas vinculadas</CardDescription>
        </div>
        {canManage ? (
          <Button asChild size="sm">
            <Link href={`/app/crm/activities/new?${params.toString()}`}>
              Nova
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <ActivitiesList items={items} canManage={canManage} compact />
      </CardContent>
    </Card>
  );
}
