"use client";

import { useState } from "react";
import { CreditCard, ShieldCheck, Star, Zap } from "lucide-react";
import { DEMO_FREE_USAGE, DEMO_PLAN, DEMO_TEAM } from "@/modules/marketing/demo-data";
import {
  ModulePageHeader,
  PageContainer,
  PageTabs,
  SectionCard,
  UsageMeter,
} from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";
function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("ativo")) return <Badge variant="success">{status}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

const SETTINGS_TABS = [
  { id: "empresa", label: "Empresa" },
  { id: "equipe", label: "Equipe" },
  { id: "permissoes", label: "Permissões" },
  { id: "assinatura", label: "Assinatura" },
];

export function DemoSettingsScreen() {
  const [section, setSection] = useState("empresa");

  return (
    <PageContainer>
      <ModulePageHeader
        title="Configurações"
        subtitle="Empresa, equipe, permissões e assinatura · dados fictícios"
      />
      <PageTabs
        active={section}
        items={SETTINGS_TABS}
        onSelect={setSection}
        className="mb-6"
      />

      {section === "empresa" ? (
        <SectionCard title="Informações da empresa" className="max-w-2xl">
          <dl className="demo-detail-list">
            {[
              ["Nome", "Empresa Exemplo Ltda."],
              ["Documento", "00.000.000/0001-00"],
              ["Telefone", "(11) 3000-0000"],
              ["E-mail", "contato@empresaexemplo.com.br"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      ) : null}

      {section === "equipe" ? (
        <SectionCard title="Membros da equipe" className="max-w-2xl">
          <div className="divide-y divide-slate-50">
            {DEMO_TEAM.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="demo-avatar">{member.name.slice(0, 2).toUpperCase()}</span>
                  <span>
                    <span className="block font-semibold text-slate-950">{member.name}</span>
                    <span className="text-sm text-slate-500">{member.role}</span>
                  </span>
                </div>
                {statusBadge(member.status)}
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {section === "permissoes" ? (
        <SectionCard title="Permissões" className="max-w-2xl">
          <p className="mb-4 text-sm text-slate-500">
            Matriz fixa por papel — somente visualização na demonstração.
          </p>
          <div className="demo-permissions">
            {["CRM", "Vendas", "Estoque", "Financeiro", "Configurações"].map((module) => (
              <div key={module}>
                <span>{module}</span>
                <ShieldCheck className="size-4 text-[var(--bos-primary)]" />
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {section === "assinatura" ? (
        <div className="max-w-3xl space-y-6">
          <SectionCard className="p-0">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">Plano atual</h2>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 uppercase">
                  Free
                </span>
              </div>
              <p className="mb-5 text-sm text-slate-500">
                Você está no plano gratuito. Faça upgrade para o PRO para ter acesso ilimitado.
              </p>
              <h3 className="mb-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
                Uso atual
              </h3>
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {DEMO_FREE_USAGE.map((item) => (
                  <UsageMeter
                    key={item.label}
                    label={item.label}
                    used={item.used}
                    limit={item.limit}
                    status={item.status}
                  />
                ))}
              </div>
            </div>
          </SectionCard>

          <div className="relative overflow-hidden rounded-2xl bg-[var(--bos-navy)] p-6">
            <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-[var(--bos-primary)]/10" />
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2">
                <Star size={16} className="text-[var(--bos-primary)]" fill="currentColor" />
                <span className="text-xs font-bold tracking-widest text-[var(--bos-primary)] uppercase">
                  Plano PRO
                </span>
              </div>
              <div className="mb-2 flex items-end gap-2">
                <span className="text-4xl font-extrabold text-white">R$ 197</span>
                <span className="mb-1 text-base text-white/50">/mês</span>
              </div>
              <p className="mb-5 text-sm text-white/60">
                Tudo liberado. Sem limites. Cresça sem barreira.
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--bos-primary)] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25"
              >
                <Zap size={14} /> Fazer upgrade para PRO
              </button>
              <p className="mt-3 text-xs text-white/30">
                Cobrança via Asaas · {DEMO_PLAN.name}
              </p>
            </div>
          </div>

          <SectionCard title="Sobre a assinatura PRO">
            <div className="flex items-start gap-3 text-sm text-slate-500">
              <CreditCard className="mt-0.5 size-5 shrink-0 text-[var(--bos-primary)]" />
              <p>
                Cobrança via Asaas (boleto, PIX ou cartão). A fatura abre em ambiente externo — sem
                checkout interno fictício.
              </p>
            </div>
          </SectionCard>
        </div>
      ) : null}

    </PageContainer>
  );
}
