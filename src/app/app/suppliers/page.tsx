import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { supplierListQuerySchema } from "@/modules/purchases/schemas/supplier.schemas";
import {
  canManageSuppliers,
  listSuppliersForTenant,
} from "@/modules/purchases/services/supplier.service";
import { SuppliersFilters } from "@/modules/purchases/components/suppliers-filters";
import { SuppliersTable } from "@/modules/purchases/components/suppliers-table";
import { Button } from "@/shared/ui/button";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("suppliers:view");
  const raw = await searchParams;
  const parsed = supplierListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const query = parsed.success
    ? parsed.data
    : supplierListQuerySchema.parse({ page: 1 });
  const result = await listSuppliersForTenant({
    companyId: user.companyId,
    role: user.role,
    query,
  });
  const canManage = canManageSuppliers(user.role);

  function pageHref(page: number) {
    return `/app/suppliers?${new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(query)
          .filter(([, value]) => value != null && value !== "")
          .map(([key, value]) => [key, String(value)]),
      ),
      page: String(page),
    }).toString()}`;
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operação"
        title="Fornecedores"
        description={`Cadastro por empresa · ${result.total} registro(s)`}
        actions={
          canManage ? (
          <Button asChild>
            <Link href="/app/suppliers/new">Novo fornecedor</Link>
          </Button>
          ) : null
        }
      />
      <SuppliersFilters query={query} />
      <SuppliersTable items={result.items} canManage={canManage} />
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {result.page} de {result.pageCount}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(result.page - 1)}>Anterior</Link>
            </Button>
          ) : null}
          {result.page < result.pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(result.page + 1)}>Próxima</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
