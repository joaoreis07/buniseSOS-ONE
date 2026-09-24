import { requirePermission } from "@/shared/auth/session";
import { financeListQuerySchema } from "@/modules/finance/schemas/finance.schemas";
import { listFinanceForTenant } from "@/modules/finance/services/finance.service";
import { FinanceFilters } from "@/modules/finance/components/finance-filters";
import {
  FinanceKpis,
  FinanceTable,
} from "@/modules/finance/components/finance-table";
import {
  ModulePageHeader,
  PageContainer,
  PaginationBar,
} from "@/shared/components/page-layout";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("finance:view");
  const raw = await searchParams;
  const parsed = financeListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status:
      typeof raw.status === "string" && raw.status !== "ALL"
        ? raw.status
        : undefined,
    customerId:
      typeof raw.customerId === "string" && raw.customerId !== "ALL"
        ? raw.customerId
        : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const query = parsed.success
    ? parsed.data
    : financeListQuerySchema.parse({ page: 1 });
  const result = await listFinanceForTenant({
    companyId: user.companyId,
    role: user.role,
    query,
  });

  function pageHref(page: number) {
    return `/app/finance?${new URLSearchParams({
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
      <ModulePageHeader
        title="Financeiro"
        subtitle={`Contas a receber · ${result.total} registro(s)`}
      />
      <FinanceKpis kpis={result.kpis} />
      <FinanceFilters query={query} customers={result.customers} />
      <FinanceTable items={result.items} />
      <PaginationBar
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        totalLabel="registro(s)"
        prevHref={result.page > 1 ? pageHref(result.page - 1) : undefined}
        nextHref={result.page < result.pageCount ? pageHref(result.page + 1) : undefined}
      />
    </PageContainer>
  );
}
