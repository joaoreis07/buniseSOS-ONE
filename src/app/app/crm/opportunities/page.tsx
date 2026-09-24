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
import { PageContainer, PaginationBar } from "@/shared/components/page-layout";

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
    <PageContainer>
      <CrmSubnav role={user.role} active="opportunities" />

      <OpportunitiesFilters
        query={query}
        owners={meta.owners}
        leads={meta.leads}
        customers={meta.customers}
        actions={
          canManage ? (
            <Button asChild size="sm">
              <Link href="/app/crm/opportunities/new">Nova oportunidade</Link>
            </Button>
          ) : null
        }
      />
      <OpportunitiesTable
        items={result.items}
        canManage={canManage}
        summary={{
          count: result.total,
          totalValue: result.items.reduce(
            (sum, item) => sum + Number(item.estimatedValue ?? 0),
            0,
          ),
        }}
      />

      <PaginationBar
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        totalLabel="oportunidade(s)"
        prevHref={
          result.page > 1
            ? `/app/crm/opportunities?${toQueryParams(query, result.page - 1)}`
            : undefined
        }
        nextHref={
          result.page < result.pageCount
            ? `/app/crm/opportunities?${toQueryParams(query, result.page + 1)}`
            : undefined
        }
      />
    </PageContainer>
  );
}
