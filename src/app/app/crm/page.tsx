import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { customerListQuerySchema } from "@/modules/crm/schemas/customer.schemas";
import {
  canManageCustomers,
  getCustomerFormMeta,
  listCustomersForTenant,
} from "@/modules/crm/services/customer.service";
import { CustomersFilters } from "@/modules/crm/components/customers-filters";
import { CustomersTable } from "@/modules/crm/components/customers-table";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { Button } from "@/shared/ui/button";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

export default async function CrmCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("crm:view");
  const raw = await searchParams;
  const parsed = customerListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    origin: typeof raw.origin === "string" ? raw.origin : undefined,
    ownerId: typeof raw.ownerId === "string" ? raw.ownerId : undefined,
    createdFrom: typeof raw.createdFrom === "string" ? raw.createdFrom : undefined,
    createdTo: typeof raw.createdTo === "string" ? raw.createdTo : undefined,
    commerce: typeof raw.commerce === "string" ? raw.commerce : undefined,
    balance: typeof raw.balance === "string" ? raw.balance : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : "20",
  });

  const query = parsed.success
    ? parsed.data
    : customerListQuerySchema.parse({ page: 1, pageSize: 20 });

  const [result, meta] = await Promise.all([
    listCustomersForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    }),
    getCustomerFormMeta(user.companyId),
  ]);

  const canManage = canManageCustomers(user.role);
  const canSales = hasPermission(user.role, "sales:view");
  const canFinance = hasPermission(user.role, "finance:view");

  return (
    <PageContainer>
      <CrmSubnav role={user.role} active="customers" />

      <PageHeader
        eyebrow="Relacionamento"
        title="Clientes"
        description={
          <>
            Relacionamento comercial · {result.total} cliente
            {result.total === 1 ? "" : "s"}
          </>
        }
        actions={
          canManage ? (
          <Button asChild>
            <Link href="/app/crm/new">Novo cliente</Link>
          </Button>
          ) : null
        }
      />

      <CustomersFilters
        query={query}
        origins={meta.origins}
        owners={meta.owners}
      />

      <CustomersTable
        items={result.items}
        canManage={canManage}
        canSales={canSales}
        canFinance={canFinance}
      />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {result.total} cliente{result.total === 1 ? "" : "s"} · página{" "}
          {result.page} de {result.pageCount}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/app/crm?${new URLSearchParams({
                  ...Object.fromEntries(
                    Object.entries(query)
                      .filter(([, v]) => v != null && v !== "")
                      .map(([k, v]) => [k, String(v)]),
                  ),
                  page: String(result.page - 1),
                }).toString()}`}
              >
                Anterior
              </Link>
            </Button>
          ) : null}
          {result.page < result.pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/app/crm?${new URLSearchParams({
                  ...Object.fromEntries(
                    Object.entries(query)
                      .filter(([, v]) => v != null && v !== "")
                      .map(([k, v]) => [k, String(v)]),
                  ),
                  page: String(result.page + 1),
                }).toString()}`}
              >
                Próxima
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
