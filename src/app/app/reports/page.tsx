import Link from "next/link";
import { DollarSign, Package, TrendingUp, Truck } from "lucide-react";
import { requirePermission } from "@/shared/auth/session";
import { availableReports } from "@/modules/reports/services/reports.service";
import { EmptyBlock } from "@/modules/reports/components/kpi-card";
import {
  ModulePageHeader,
  PageContainer,
} from "@/shared/components/page-layout";

const REPORTS = [
  {
    type: "sales" as const,
    href: "/app/reports/sales",
    tag: "Vendas",
    title: "Relatório de Vendas",
    description: "Receita, ticket médio, produtos vendidos e tendências.",
    icon: TrendingUp,
    color: "bg-blue-50 text-blue-600",
  },
  {
    type: "finance" as const,
    href: "/app/reports/finance",
    tag: "Financeiro",
    title: "Relatório Financeiro",
    description: "Contas a receber, saldo e vencidos.",
    icon: DollarSign,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    type: "inventory" as const,
    href: "/app/reports/inventory",
    tag: "Estoque",
    title: "Relatório de Estoque",
    description: "Saldo por produto, giro, movimentações e alertas.",
    icon: Package,
    color: "bg-amber-50 text-amber-600",
  },
  {
    type: "purchases" as const,
    href: "/app/reports/purchases",
    tag: "Compras",
    title: "Relatório de Compras",
    description: "Compras por fornecedor, período e categorias.",
    icon: Truck,
    color: "bg-violet-50 text-violet-600",
  },
];

export default async function ReportsIndexPage() {
  const user = await requirePermission("reports:view");
  const allowed = availableReports(user.role);
  const cards = REPORTS.filter((item) => allowed.includes(item.type));

  return (
    <PageContainer>
      <ModulePageHeader
        title="Relatórios"
        subtitle="Central de análises e exportações"
      />

      {cards.length === 0 ? (
        <EmptyBlock>Nenhum relatório disponível para o seu perfil.</EmptyBlock>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((report) => {
            const Icon = report.icon;
            return (
              <Link
                key={report.type}
                href={report.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-300 hover:shadow-sm"
              >
                <div
                  className={`mb-3 flex size-10 items-center justify-center rounded-xl ${report.color}`}
                >
                  <Icon className="size-[18px]" aria-hidden />
                </div>
                <div className="mb-1 text-xs font-semibold text-slate-300">
                  {report.tag}
                </div>
                <h3 className="mb-1 text-sm font-bold text-slate-800 group-hover:text-slate-900">
                  {report.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-400">
                  {report.description}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
