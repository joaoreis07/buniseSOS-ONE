import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { communicationListQuerySchema } from "@/modules/communications/schemas/communication.schemas";
import {
  canSendCommunications,
  listCommunicationsForTenant,
} from "@/modules/communications/services/communication.service";
import { getCompanyUsageSnapshot } from "@/modules/billing/services/entitlements.service";
import { CommunicationsSubnav } from "@/modules/communications/components/communications-subnav";
import { CommunicationsFilters } from "@/modules/communications/components/communications-filters";
import { CommunicationsTable } from "@/modules/communications/components/communications-table";
import { Button } from "@/shared/ui/button";
import {
  ModulePageHeader,
  PageContainer,
  PaginationBar,
} from "@/shared/components/page-layout";

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function CommunicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("communications:view");
  const raw = await searchParams;
  const parsed = communicationListQuerySchema.safeParse({
    q: first(raw.q),
    customerId: first(raw.customerId),
    userId: first(raw.userId),
    channel: first(raw.channel),
    type: first(raw.type),
    status: first(raw.status),
    origin: first(raw.origin),
    from: first(raw.from),
    to: first(raw.to),
    page: first(raw.page) ?? "1",
    pageSize: first(raw.pageSize) ?? "20",
  });
  const query = parsed.success
    ? parsed.data
    : communicationListQuerySchema.parse({ page: 1, pageSize: 20 });

  const [result, usage] = await Promise.all([
    listCommunicationsForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    }),
    getCompanyUsageSnapshot(user.companyId),
  ]);
  const canSend = canSendCommunications(user.role);
  const commUsage = usage.find((u) => u.feature === "communications_month");
  const queryParams = Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value != null && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );

  const usageSubtitle =
    commUsage?.limit != null
      ? `${commUsage.used} / ${commUsage.limit} comunicações este mês (plano Free)`
      : `${result.total} comunicação(ões) registradas`;

  return (
    <PageContainer>
      <CommunicationsSubnav role={user.role} active="history" />
      <ModulePageHeader
        title="Comunicações"
        subtitle={usageSubtitle}
        actions={
          canSend ? (
            <Button asChild size="sm" className="h-8">
              <Link href="/app/communications/new">Nova comunicação</Link>
            </Button>
          ) : null
        }
      />

      <CommunicationsFilters
        query={query}
        customers={result.customers}
        authors={result.authors}
      />
      <CommunicationsTable items={result.items} />

      <PaginationBar
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        totalLabel="comunicação(ões)"
        prevHref={
          result.page > 1
            ? `/app/communications?${new URLSearchParams({
                ...queryParams,
                page: String(result.page - 1),
              }).toString()}`
            : undefined
        }
        nextHref={
          result.page < result.pageCount
            ? `/app/communications?${new URLSearchParams({
                ...queryParams,
                page: String(result.page + 1),
              }).toString()}`
            : undefined
        }
      />
    </PageContainer>
  );
}
