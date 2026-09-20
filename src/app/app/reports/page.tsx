import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { availableReports } from "@/modules/reports/services/reports.service";
import { EmptyBlock } from "@/modules/reports/components/kpi-card";
import { Button } from "@/shared/ui/button";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

const REPORTS = [
  {
    type: "sales" as const,
    href: "/app/reports/sales",
    title: "Vendas",
    description: "Vendas, itens, descontos e totais por período.",
  },
  {
    type: "finance" as const,
    href: "/app/reports/finance",
    title: "Financeiro",
    description: "Contas a receber, saldo e vencidos.",
  },
  {
    type: "inventory" as const,
    href: "/app/reports/inventory",
    title: "Estoque",
    description: "Saldos, mínimos e status dos produtos físicos.",
  },
  {
    type: "purchases" as const,
    href: "/app/reports/purchases",
    title: "Compras",
    description: "Compras recebidas, fornecedores e custos.",
  },
];

export default async function ReportsIndexPage() {
  const user = await requirePermission("reports:view");
  const allowed = availableReports(user.role);
  const cards = REPORTS.filter((item) => allowed.includes(item.type));

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Gestão"
        title="Relatórios"
        description="Consultas operacionais com filtros no servidor e exportação CSV"
        actions={
          <Button asChild variant="outline">
          <Link href="/app">Dashboard</Link>
        </Button>
        }
      />

      {cards.length === 0 ? (
        <EmptyBlock>Nenhum relatório disponível para o seu perfil.</EmptyBlock>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((report) => (
            <Card key={report.type}>
              <CardHeader>
                <CardTitle>{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={report.href}>Abrir relatório</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
