import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { rolesAssignableBy } from "@/shared/permissions/rbac";
import { teamListQuerySchema } from "@/modules/team/schemas/team.schemas";
import {
  canManageTeam,
  listInvitesForTenant,
  listTeamForTenant,
} from "@/modules/team/services/team.service";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import { TeamFilters } from "@/modules/team/components/team-filters";
import { TeamTable } from "@/modules/team/components/team-table";
import { InviteMemberForm } from "@/modules/team/components/invite-member-form";
import { InvitesTable } from "@/modules/team/components/invites-table";
import { Button } from "@/shared/ui/button";
import { PageContainer, PaginationBar, SectionCard } from "@/shared/components/page-layout";

function queryToParams(query: Record<string, unknown>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === "") continue;
    params.set(key, String(value));
  }
  params.set("page", String(page));
  return params.toString();
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("team:view");
  const raw = await searchParams;
  const parsed = teamListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    role: typeof raw.role === "string" ? raw.role : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    page: typeof raw.page === "string" ? raw.page : "1",
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : "20",
  });
  const query = parsed.success
    ? parsed.data
    : teamListQuerySchema.parse({ page: 1, pageSize: 20 });

  const [result, invites] = await Promise.all([
    listTeamForTenant({
      companyId: user.companyId,
      role: user.role,
      query,
    }),
    listInvitesForTenant({
      companyId: user.companyId,
      role: user.role,
    }),
  ]);

  const canManage = canManageTeam(user.role);
  const allowedRoles = rolesAssignableBy(user.role);

  return (
    <PageContainer>
      <SettingsSubnav role={user.role} active="team" />

      <div className="max-w-4xl space-y-6">
        <SectionCard
          title="Membros da equipe"
          description={`${result.total} registro${result.total === 1 ? "" : "s"} · filtros e paginação abaixo`}
        >
          <TeamFilters query={query} />
          <div className="mt-4">
            <TeamTable items={result.items} />
          </div>
          <div className="mt-4">
            <PaginationBar
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              totalLabel="membros"
              prevHref={
                result.page > 1
                  ? `/app/settings/team?${queryToParams(query, result.page - 1)}`
                  : undefined
              }
              nextHref={
                result.page < result.pageCount
                  ? `/app/settings/team?${queryToParams(query, result.page + 1)}`
                  : undefined
              }
            />
          </div>
        </SectionCard>

        {canManage ? (
          <SectionCard
            title="Convidar membro"
            description="O token é armazenado em hash e vale por 7 dias"
          >
            <InviteMemberForm allowedRoles={allowedRoles} />
          </SectionCard>
        ) : null}

        <SectionCard
          title="Convites"
          description="Pendentes, aceitos, expirados e cancelados"
        >
          <InvitesTable items={invites} canManage={canManage} />
        </SectionCard>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-800">Plano Free — limite de usuários</h3>
          <p className="mt-1 text-xs text-amber-600">
            Para adicionar mais membros à equipe, faça upgrade para o plano PRO e tenha usuários
            ilimitados.
          </p>
          <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs font-semibold text-[var(--bos-primary)]">
            <Link href="/app/settings/billing">Ver plano PRO →</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
