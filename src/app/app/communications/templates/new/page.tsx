import { requirePermission } from "@/shared/auth/session";
import { CommunicationsSubnav } from "@/modules/communications/components/communications-subnav";
import { TemplateForm } from "@/modules/communications/components/template-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function NewTemplatePage() {
  const user = await requirePermission("communications:templates");
  return (
    <div className="space-y-6">
      <CommunicationsSubnav role={user.role} active="templates" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo template</h1>
        <p className="text-muted-foreground">
          Variáveis inválidas impedem a publicação.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateForm />
        </CardContent>
      </Card>
    </div>
  );
}
