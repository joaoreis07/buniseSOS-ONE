import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { activityListQuerySchema } from "@/modules/crm/schemas/activity.schemas";
import {
  canManageActivities,
  getActivityFormMeta,
  listActivitiesForTenant,
} from "@/modules/crm/services/activity.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { ActivitiesList } from "@/modules/crm/components/activities-list";
import { ActivitiesFilters } from "@/modules/crm/components/activities-filters";
import { Button } from "@/shared/ui/button";
import { PageContainer } from "@/shared/components/page-layout";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("crm:activities:view");
  const raw = await searchParams;
  const parsed = activityListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
    ownerId: typeof raw.ownerId === "string" ? raw.ownerId : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const query = parsed.success
    ? parsed.data
    : activityListQuerySchema.parse({ page: 1 });

  const [result, meta] = await Promise.all([
    listActivitiesForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    }),
    getActivityFormMeta(user.companyId),
  ]);
  const canManage = canManageActivities(user.role);

  return (
    <PageContainer>
      <CrmSubnav role={user.role} active="activities" />

      <ActivitiesFilters
        query={query}
        owners={meta.owners}
        actions={
          canManage ? (
            <Button asChild size="sm">
              <Link href="/app/crm/activities/new">Nova atividade</Link>
            </Button>
          ) : null
        }
      />

      <ActivitiesList items={result.items} canManage={canManage} />
    </PageContainer>
  );
}
