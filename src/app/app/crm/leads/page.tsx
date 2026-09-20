import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { leadListQuerySchema } from "@/modules/crm/schemas/lead.schemas";
import {
  canManageLeads,
  getLeadFormMeta,
  listLeadsForTenant,
} from "@/modules/crm/services/lead.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { LeadsFilters } from "@/modules/crm/components/leads-filters";
import { LeadsTable } from "@/modules/crm/components/leads-table";
import { Button } from "@/shared/ui/button";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

function toQueryParams(
  query: Record<string, unknown>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "") continue;
    if (key === "page") continue;
    params.set(key, String(value));
  }
  params.set("page", String(page));
  return params.toString();
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("crm:leads:view");
  const raw = await searchParams;
  const parsed = leadListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    origin: typeof raw.origin === "string" ? raw.origin : undefined,
    ownerId: typeof raw.ownerId === "string" ? raw.ownerId : undefined,
    createdFrom:
      typeof raw.createdFrom === "string" ? raw.createdFrom : undefined,
    createdTo: typeof raw.createdTo === "string" ? raw.createdTo : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : "20",
  });

  const query = parsed.success
    ? parsed.data
    : leadListQuerySchema.parse({ page: 1, pageSize: 20 });

  const [result, meta] = await Promise.all([
    listLeadsForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    }),
    getLeadFormMeta(user.companyId),
  ]);

  const canManage = canManageLeads(user.role);

  return (
    <PageContainer>
      <CrmSubnav role={user.role} active="leads" />

      <PageHeader
        eyebrow="CRM"
        title="Leads"
        description="Interesses comerciais antes da conversão em cliente ou oportunidade."
        actions={
          canManage ? (
          <Button asChild>
            <Link href="/app/crm/leads/new">Novo lead</Link>
          </Button>
          ) : null
        }
      />

      <LeadsFilters query={query} owners={meta.owners} />
      <LeadsTable items={result.items} canManage={canManage} />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {result.total} lead{result.total === 1 ? "" : "s"} · página{" "}
          {result.page} de {result.pageCount}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/crm/leads?${toQueryParams(query, result.page - 1)}`}>
                Anterior
              </Link>
            </Button>
          ) : null}
          {result.page < result.pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/crm/leads?${toQueryParams(query, result.page + 1)}`}>
                Próxima
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
