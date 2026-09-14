import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import {
  canManageTemplates,
  listTemplatesForTenant,
} from "@/modules/communications/services/communication.service";
import { CommunicationsSubnav } from "@/modules/communications/components/communications-subnav";
import { ToggleTemplateButton } from "@/modules/communications/components/toggle-template-button";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_TYPE_LABELS,
} from "@/modules/communications/lib/labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function CommunicationTemplatesPage() {
  const user = await requirePermission("communications:view");
  const templates = await listTemplatesForTenant({
    companyId: user.companyId,
    role: user.role,
  });
  const canManage = canManageTemplates(user.role);

  return (
    <div className="space-y-6">
      <CommunicationsSubnav role={user.role} active="templates" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Mensagens reutilizáveis com variáveis determinísticas
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/app/communications/templates/new">Novo template</Link>
          </Button>
        ) : null}
      </div>

      {templates.length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          Nenhum template cadastrado.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    <Link
                      href={`/app/communications/templates/${template.id}`}
                      className="hover:underline"
                    >
                      {template.name}
                    </Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {COMMUNICATION_CHANNEL_LABELS[template.channel]} ·{" "}
                    {COMMUNICATION_TYPE_LABELS[template.type]}
                  </p>
                </div>
                <Badge variant={template.active ? "default" : "secondary"}>
                  {template.active ? "Ativo" : "Inativo"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="line-clamp-4 whitespace-pre-wrap text-sm">
                  {template.body}
                </p>
                {canManage ? (
                  <ToggleTemplateButton
                    templateId={template.id}
                    active={template.active}
                  />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
