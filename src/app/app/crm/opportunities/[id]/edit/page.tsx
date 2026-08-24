import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  getOpportunityForTenant,
  getOpportunityFormMeta,
} from "@/modules/crm/services/opportunity.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { OpportunityForm } from "@/modules/crm/components/opportunity-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("crm:opportunities:manage");
  const { id } = await params;
  const [opportunity, meta] = await Promise.all([
    getOpportunityForTenant({
      companyId: user.companyId,
      role: user.role,
      opportunityId: id,
    }),
    getOpportunityFormMeta(user.companyId),
  ]);

  if (!opportunity) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <CrmSubnav role={user.role} active="opportunities" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar oportunidade
          </h1>
          <p className="text-muted-foreground">{opportunity.name}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/app/crm/opportunities/${opportunity.id}`}>Voltar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados da oportunidade</CardTitle>
        </CardHeader>
        <CardContent>
          <OpportunityForm
            mode="edit"
            opportunity={opportunity}
            owners={meta.owners}
            leads={meta.leads}
            customers={meta.customers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
