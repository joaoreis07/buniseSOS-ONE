import { requirePermission } from "@/shared/auth/session";
import { financeListQuerySchema } from "@/modules/finance/schemas/finance.schemas";
import { listFinanceForTenant } from "@/modules/finance/services/finance.service";
import { FinanceFilters } from "@/modules/finance/components/finance-filters";
import {
  FinanceKpis,
  FinanceTable,
} from "@/modules/finance/components/finance-table";
import { Button } from "@/shared/ui/button";
import Link from "next/link";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">
          Contas a receber, parcelas e baixas · {result.total} registro(s)
        </p>
      </div>
      <FinanceKpis kpis={result.kpis} />
      <FinanceFilters query={query} customers={result.customers} />
      <FinanceTable items={result.items} />
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
    </div>
  );
}
