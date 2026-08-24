import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  getActivityForTenant,
  getActivityFormMeta,
} from "@/modules/crm/services/activity.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { ActivityForm } from "@/modules/crm/components/activity-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("crm:activities:manage");
  const { id } = await params;
  const [activity, meta] = await Promise.all([
    getActivityForTenant({
      companyId: user.companyId,
      role: user.role,
      activityId: id,
    }),
    getActivityFormMeta(user.companyId),
  ]);
  if (!activity) notFound();

  return (
    <div className="space-y-6">
      <CrmSubnav role={user.role} active="activities" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar atividade
          </h1>
          <p className="text-muted-foreground">{activity.title}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/app/crm/activities/${activity.id}`}>Voltar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityForm
            mode="edit"
            activity={activity}
            owners={meta.owners}
            customers={meta.customers}
            leads={meta.leads}
            opportunities={meta.opportunities}
          />
        </CardContent>
      </Card>
    </div>
  );
}
