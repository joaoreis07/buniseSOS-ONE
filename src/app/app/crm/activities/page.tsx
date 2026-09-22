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
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPE_LABELS,
} from "@/modules/crm/lib/activity-labels";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

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
      <PageHeader
        eyebrow="CRM"
        title="Atividades"
        description={`Follow-ups do CRM · ${result.total} registro(s)`}
        actions={
          canManage ? (
          <Button asChild>
            <Link href="/app/crm/activities/new">Nova atividade</Link>
          </Button>
          ) : null
        }
      />

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="q">Busca</Label>
          <Input id="q" name="q" defaultValue={query.q ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={query.status ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(ACTIVITY_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="type">Tipo</Label>
          <select
            id="type"
            name="type"
            defaultValue={query.type ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="ownerId">Responsável</Label>
          <select
            id="ownerId"
            name="ownerId"
            defaultValue={query.ownerId ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Todos</option>
            {meta.owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name ?? owner.email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2 md:col-span-2">
          <Button type="submit">Filtrar</Button>
          <Button asChild variant="outline">
            <Link href="/app/crm/activities">Limpar</Link>
          </Button>
        </div>
      </form>

      <ActivitiesList items={result.items} canManage={canManage} />
    </PageContainer>
  );
}
