import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { requirePermission } from "@/shared/auth/session";
import type { Permission } from "@/shared/permissions/rbac";

const MODULE_META: Record<
  string,
  { title: string; permission: Permission; description: string }
> = {
  crm: {
    title: "CRM",
    permission: "crm:view",
    description: "Módulo de CRM — implementação na FASE 4.",
  },
  sales: {
    title: "Vendas",
    permission: "sales:view",
    description: "Módulo de vendas — implementação na FASE 7.",
  },
  products: {
    title: "Produtos",
    permission: "products:view",
    description: "Produtos e serviços — implementação na FASE 5.",
  },
  inventory: {
    title: "Estoque",
    permission: "inventory:view",
    description: "Estoque — implementação na FASE 6.",
  },
  finance: {
    title: "Financeiro",
    permission: "finance:view",
    description: "Financeiro do One — implementação na FASE 8.",
  },
  dre: {
    title: "DRE",
    permission: "dre:view",
    description: "DRE integrado — implementação na FASE 9.",
  },
  ecommerce: {
    title: "E-commerce",
    permission: "ecommerce:view",
    description: "Loja — implementação na FASE 11.",
  },
};

export default async function ModulePlaceholderPage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleKey } = await params;
  const meta = MODULE_META[moduleKey];
  if (!meta) {
    notFound();
  }

  const user = await requirePermission(meta.permission);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
        <p className="text-muted-foreground">{meta.description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Acesso autorizado</CardTitle>
          <CardDescription>
            Rota protegida por sessão + RBAC no servidor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Tenant:</span>{" "}
            {user.companyId}
          </p>
          <p>
            <span className="text-muted-foreground">Papel:</span> {user.role}
          </p>
          <p>
            <span className="text-muted-foreground">Permissão:</span>{" "}
            {meta.permission}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
