import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { getActivityFormMeta } from "@/modules/crm/services/activity.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { ActivityForm } from "@/modules/crm/components/activity-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function NewActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("crm:activities:manage");
  const raw = await searchParams;
  const meta = await getActivityFormMeta(user.companyId);

  return (
    <div className="space-y-6">
      <CrmSubnav role={user.role} active="activities" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nova atividade
          </h1>
          <p className="text-muted-foreground">
            Vincule a cliente, lead ou oportunidade do mesmo tenant
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/crm/activities">Voltar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityForm
            mode="create"
            owners={meta.owners}
            customers={meta.customers}
            leads={meta.leads}
            opportunities={meta.opportunities}
            defaults={{
              customerId:
                typeof raw.customerId === "string" ? raw.customerId : undefined,
              leadId: typeof raw.leadId === "string" ? raw.leadId : undefined,
              opportunityId:
                typeof raw.opportunityId === "string"
                  ? raw.opportunityId
                  : undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
