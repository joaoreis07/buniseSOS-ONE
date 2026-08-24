import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  getLeadForTenant,
  getLeadFormMeta,
} from "@/modules/crm/services/lead.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { LeadForm } from "@/modules/crm/components/lead-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("crm:leads:manage");
  const { id } = await params;
  const [lead, meta] = await Promise.all([
    getLeadForTenant({
      companyId: user.companyId,
      role: user.role,
      leadId: id,
    }),
    getLeadFormMeta(user.companyId),
  ]);

  if (!lead) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <CrmSubnav role={user.role} active="leads" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Editar lead</h1>
          <p className="text-muted-foreground">{lead.name}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/app/crm/leads/${lead.id}`}>Voltar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do lead</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm mode="edit" lead={lead} owners={meta.owners} />
        </CardContent>
      </Card>
    </div>
  );
}
