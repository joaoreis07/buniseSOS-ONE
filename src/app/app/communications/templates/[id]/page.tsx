import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  canManageTemplates,
  getTemplateForTenant,
  previewTemplateForTenant,
} from "@/modules/communications/services/communication.service";
import { CommunicationsSubnav } from "@/modules/communications/components/communications-subnav";
import { TemplateForm } from "@/modules/communications/components/template-form";
import { ToggleTemplateButton } from "@/modules/communications/components/toggle-template-button";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("communications:view");
  const { id } = await params;
  const template = await getTemplateForTenant({
    companyId: user.companyId,
    role: user.role,
    templateId: id,
  });
  if (!template) notFound();
  const canManage = canManageTemplates(user.role);
  const preview = await previewTemplateForTenant({
    companyId: user.companyId,
    role: user.role,
    body: template.body,
    subject: template.subject,
  });

  return (
    <div className="space-y-6">
      <CommunicationsSubnav role={user.role} active="templates" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{template.name}</h1>
          <p className="text-muted-foreground">
            {template.active ? "Ativo" : "Inativo"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/communications/templates">Voltar</Link>
          </Button>
          {canManage ? (
            <ToggleTemplateButton templateId={template.id} active={template.active} />
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
        </CardHeader>
        <CardContent>
          {preview.unknown.length > 0 ? (
            <p className="mb-3 text-sm text-destructive">
              Variáveis inválidas: {preview.unknown.map((name) => `{{${name}}}`).join(", ")}
            </p>
          ) : null}
          <p className="whitespace-pre-wrap text-sm">{preview.text}</p>
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Editar</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateForm template={template} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
