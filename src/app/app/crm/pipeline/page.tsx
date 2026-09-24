import { requirePermission } from "@/shared/auth/session";
import {
  canManagePipeline,
  getPipelineBoard,
} from "@/modules/crm/services/pipeline.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { PipelineBoard } from "@/modules/crm/components/pipeline-board";
import { hasPermission } from "@/shared/permissions/rbac";
import { PageContainer } from "@/shared/components/page-layout";

export default async function PipelinePage() {
  const user = await requirePermission("crm:pipeline:view");
  const board = await getPipelineBoard({
    companyId: user.companyId,
    role: user.role,
  });
  const canManage = canManagePipeline(user.role);

  return (
    <PageContainer>
      <CrmSubnav role={user.role} active="pipeline" />
      <PipelineBoard
        columns={board.columns}
        canManage={canManage}
        canCreate={hasPermission(user.role, "crm:opportunities:manage")}
      />
    </PageContainer>
  );
}
