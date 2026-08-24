import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { getOpportunityFormMeta } from "@/modules/crm/services/opportunity.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { OpportunityForm } from "@/modules/crm/components/opportunity-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function NewOpportunityPage() {
  const user = await requirePermission("crm:opportunities:manage");
  const meta = await getOpportunityFormMeta(user.companyId);

  return (
    <div className="space-y-6">
      <CrmSubnav role={user.role} active="opportunities" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nova oportunidade
          </h1>
          <p className="text-muted-foreground">
            Vinculada à empresa da sessão; lead/cliente opcionais do mesmo tenant
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/crm/opportunities">Voltar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados da oportunidade</CardTitle>
        </CardHeader>
        <CardContent>
          <OpportunityForm
            mode="create"
            owners={meta.owners}
            leads={meta.leads}
            customers={meta.customers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
