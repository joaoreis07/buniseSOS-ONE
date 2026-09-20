import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { communicationListQuerySchema } from "@/modules/communications/schemas/communication.schemas";
import {
  canSendCommunications,
  listCommunicationsForTenant,
} from "@/modules/communications/services/communication.service";
import { CommunicationsSubnav } from "@/modules/communications/components/communications-subnav";
import { CommunicationsFilters } from "@/modules/communications/components/communications-filters";
import { CommunicationsTable } from "@/modules/communications/components/communications-table";
import { Button } from "@/shared/ui/button";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

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

  const result = await listCommunicationsForTenant({
    companyId: user.companyId,
    role: user.role,
    query,
  });
  const canSend = canSendCommunications(user.role);
  const queryParams = Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value != null && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );

  return (
    <PageContainer>
      <CommunicationsSubnav role={user.role} active="history" />
      <PageHeader
        eyebrow="Relacionamento"
        title="Comunicações"
        description={`Histórico de mensagens preparadas e registradas · ${result.total}`}
        actions={
          canSend ? (
          <Button asChild>
            <Link href="/app/communications/new">Preparar WhatsApp</Link>
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

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {result.page} de {result.pageCount}
        </span>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/app/communications?${new URLSearchParams({
                  ...queryParams,
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
                href={`/app/communications?${new URLSearchParams({
                  ...queryParams,
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
