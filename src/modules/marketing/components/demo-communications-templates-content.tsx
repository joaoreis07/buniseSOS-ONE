"use client";

import { DEMO_COMMUNICATION_TEMPLATES } from "@/modules/marketing/demo-data";
import { CommunicationsSubnav } from "@/modules/communications/components/communications-subnav";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_TYPE_LABELS,
} from "@/modules/communications/lib/labels";
import { ModulePageHeader, PageContainer } from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

export function DemoCommunicationsTemplatesContent() {
  return (
    <PageContainer>
      <CommunicationsSubnav variant="demo" active="templates" />
      <ModulePageHeader
        title="Templates"
        subtitle="Mensagens reutilizáveis com variáveis determinísticas"
        actions={
          <Button type="button" disabled size="sm" className="h-8">
            Novo template
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_COMMUNICATION_TEMPLATES.map((template) => (
          <article
            key={template.id}
            className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-800">{template.name}</h2>
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
            <div className="mt-4">
              <Button type="button" variant="outline" size="sm" disabled>
                {template.active ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </PageContainer>
  );
}
