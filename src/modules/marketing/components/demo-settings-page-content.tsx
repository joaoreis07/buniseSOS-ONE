"use client";

import { CreditCard, ShieldCheck, Star, Zap } from "lucide-react";
import { DEMO_FREE_USAGE, DEMO_PLAN, DEMO_TEAM } from "@/modules/marketing/demo-data";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { PageContainer, SectionCard, UsageMeter } from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";

type SettingsTab =
  | "company"
  | "branding"
  | "documents"
  | "preferences"
  | "team"
  | "permissions"
  | "billing";

function statusBadge(status: string) {
  if (status.toLowerCase().includes("ativo")) {
    return <Badge variant="default">{status}</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

export function DemoSettingsPageContent({ active }: { active: SettingsTab }) {
  return (
    <PageContainer>
      <SettingsSubnav variant="demo" active={active} role="ADMIN" />

      {active === "company" ? (
        <SectionCard title="Informações da empresa" className="max-w-2xl">
          <dl className="space-y-4 text-sm">
            {[
              ["Nome", "Empresa Exemplo Ltda."],
              ["Documento", "12.345.678/0001-90"],
              ["Telefone", "(11) 3000-0000"],
              ["E-mail", "contato@empresaexemplo.com.br"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] uppercase tracking-wider text-slate-400">{label}</dt>
                <dd className="font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      ) : null}

      {active === "branding" ? (
        <SectionCard title="Identidade visual" className="max-w-2xl">
          <p className="text-sm text-slate-500">Logo, cores e identidade da empresa · demonstração.</p>
        </SectionCard>
      ) : null}

      {active === "documents" ? (
        <SectionCard title="Documentos" className="max-w-2xl">
          <p className="text-sm text-slate-500">Modelos de comprovantes e documentos · demonstração.</p>
        </SectionCard>
      ) : null}

      {active === "preferences" ? (
        <SectionCard title="Preferências" className="max-w-2xl">
          <p className="text-sm text-slate-500">Fuso horário, moeda e preferências gerais · demonstração.</p>
        </SectionCard>
      ) : null}

      {active === "team" ? (
        <SectionCard title="Membros da equipe" className="max-w-2xl">
          <div className="divide-y divide-slate-50">
            {DEMO_TEAM.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-slate-800">{member.name}</p>
                  <p className="text-xs text-slate-400">{member.role}</p>
                </div>
                {statusBadge(member.status)}
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {active === "permissions" ? (
        <SectionCard title="Permissões" className="max-w-2xl">
          <p className="mb-4 text-sm text-slate-500">Matriz por papel · somente visualização na demo.</p>
          <div className="space-y-2">
            {["CRM", "Vendas", "Estoque", "Financeiro", "Configurações"].map((module) => (
              <div key={module} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span>{module}</span>
                <ShieldCheck className="size-4 text-[var(--bos-primary)]" />
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {active === "billing" ? (
        <div className="max-w-3xl space-y-6">
          <SectionCard className="p-0">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">Plano atual</h2>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 uppercase">Free</span>
              </div>
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {DEMO_FREE_USAGE.map((item) => (
                  <UsageMeter key={item.label} label={item.label} used={item.used} limit={item.limit} status={item.status} />
                ))}
              </div>
            </div>
          </SectionCard>
          <div className="relative overflow-hidden rounded-2xl bg-[var(--bos-navy)] p-6">
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2">
                <Star size={16} className="text-[var(--bos-primary)]" fill="currentColor" />
                <span className="text-xs font-bold tracking-widest text-[var(--bos-primary)] uppercase">Plano PRO</span>
              </div>
              <div className="mb-2 flex items-end gap-2">
                <span className="text-4xl font-extrabold text-white">R$ 197</span>
                <span className="mb-1 text-base text-white/50">/mês</span>
              </div>
              <button type="button" disabled className="rounded-xl bg-[var(--bos-primary)] px-6 py-2.5 text-sm font-bold text-white opacity-80">
                <Zap size={14} className="mr-1 inline" /> Fazer upgrade para PRO
              </button>
              <p className="mt-3 text-xs text-white/30">Cobrança via Asaas · {DEMO_PLAN.name}</p>
            </div>
          </div>
          <SectionCard title="Sobre a assinatura PRO">
            <div className="flex items-start gap-3 text-sm text-slate-500">
              <CreditCard className="mt-0.5 size-5 shrink-0 text-[var(--bos-primary)]" />
              <p>Cobrança via Asaas. A fatura abre em ambiente externo — sem checkout fictício.</p>
            </div>
          </SectionCard>
        </div>
      ) : null}
    </PageContainer>
  );
}
