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
import {
  EmptyState,
  ModulePageHeader,
  PageContainer,
} from "@/shared/components/page-layout";

export default async function CommunicationTemplatesPage() {
  const user = await requirePermission("communications:view");
  const templates = await listTemplatesForTenant({
    companyId: user.companyId,
    role: user.role,
  });
  const canManage = canManageTemplates(user.role);

  return (
    <PageContainer>
      <CommunicationsSubnav role={user.role} active="templates" />
      <ModulePageHeader
        title="Templates"
        subtitle="Mensagens reutilizáveis com variáveis determinísticas"
        actions={
          canManage ? (
            <Button asChild size="sm" className="h-8">
              <Link href="/app/communications/templates/new">Novo template</Link>
            </Button>
          ) : null
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          title="Nenhum template cadastrado"
          description="Crie templates para agilizar comunicações recorrentes."
          action={
            canManage ? (
              <Button asChild>
                <Link href="/app/communications/templates/new">Criar template</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <article
              key={template.id}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    <Link
                      href={`/app/communications/templates/${template.id}`}
                      className="hover:text-[var(--bos-primary)] hover:underline"
                    >
                      {template.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-slate-400">
                    {COMMUNICATION_CHANNEL_LABELS[template.channel]} ·{" "}
                    {COMMUNICATION_TYPE_LABELS[template.type]}
                  </p>
                </div>
                <Badge variant={template.active ? "success" : "secondary"}>
                  {template.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="line-clamp-4 whitespace-pre-wrap text-sm text-slate-600">
                {template.body}
              </p>
              {canManage ? (
                <div className="mt-4">
                  <ToggleTemplateButton
                    templateId={template.id}
                    active={template.active}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
