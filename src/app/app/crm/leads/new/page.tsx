import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { getLeadFormMeta } from "@/modules/crm/services/lead.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { LeadForm } from "@/modules/crm/components/lead-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function NewLeadPage() {
  const user = await requirePermission("crm:leads:manage");
  const meta = await getLeadFormMeta(user.companyId);

  return (
    <div className="space-y-6">
      <CrmSubnav role={user.role} active="leads" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Novo lead</h1>
          <p className="text-muted-foreground">
            Cadastro vinculado à empresa da sessão
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/crm/leads">Voltar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do lead</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm mode="create" owners={meta.owners} />
        </CardContent>
      </Card>
    </div>
  );
}
