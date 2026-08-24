import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { opportunityListQuerySchema } from "@/modules/crm/schemas/opportunity.schemas";
import {
  canManageOpportunities,
  getOpportunityFormMeta,
  listOpportunitiesForTenant,
} from "@/modules/crm/services/opportunity.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { OpportunitiesFilters } from "@/modules/crm/components/opportunities-filters";
import { OpportunitiesTable } from "@/modules/crm/components/opportunities-table";
import { Button } from "@/shared/ui/button";

function toQueryParams(query: Record<string, unknown>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "" || key === "page") continue;
    params.set(key, String(value));
  }
  params.set("page", String(page));
  return params.toString();
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("crm:opportunities:view");
  const raw = await searchParams;
  const parsed = opportunityListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    stage: typeof raw.stage === "string" ? raw.stage : undefined,
    ownerId: typeof raw.ownerId === "string" ? raw.ownerId : undefined,
    leadId: typeof raw.leadId === "string" ? raw.leadId : undefined,
    customerId: typeof raw.customerId === "string" ? raw.customerId : undefined,
    createdFrom:
      typeof raw.createdFrom === "string" ? raw.createdFrom : undefined,
    createdTo: typeof raw.createdTo === "string" ? raw.createdTo : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : "20",
  });

  const query = parsed.success
    ? parsed.data
    : opportunityListQuerySchema.parse({ page: 1, pageSize: 20 });

  const [result, meta] = await Promise.all([
    listOpportunitiesForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    }),
    getOpportunityFormMeta(user.companyId),
  ]);

  const canManage = canManageOpportunities(user.role);

  return (
    <div className="space-y-6">
      <CrmSubnav role={user.role} active="opportunities" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Oportunidades
          </h1>
          <p className="text-muted-foreground">
            Negócios em andamento — listagem (funil visual na FASE 4.4).
          </p>
        </div>
        {canManage ? (
          <Button asChild>
            <Link href="/app/crm/opportunities/new">Nova oportunidade</Link>
          </Button>
        ) : null}
      </div>

      <OpportunitiesFilters
        query={query}
        owners={meta.owners}
        leads={meta.leads}
        customers={meta.customers}
      />
      <OpportunitiesTable items={result.items} canManage={canManage} />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {result.total} oportunidade{result.total === 1 ? "" : "s"} · página{" "}
          {result.page} de {result.pageCount}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/app/crm/opportunities?${toQueryParams(query, result.page - 1)}`}
              >
                Anterior
              </Link>
            </Button>
          ) : null}
          {result.page < result.pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/app/crm/opportunities?${toQueryParams(query, result.page + 1)}`}
              >
                Próxima
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
