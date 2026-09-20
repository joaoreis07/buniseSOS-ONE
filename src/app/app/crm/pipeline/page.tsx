import { requirePermission } from "@/shared/auth/session";
import {
  canManagePipeline,
  getPipelineBoard,
} from "@/modules/crm/services/pipeline.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { PipelineBoard } from "@/modules/crm/components/pipeline-board";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

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
      <PageHeader
        eyebrow="CRM"
        title="Funil"
        description={`Board de oportunidades por estágio · ${board.total} no pipeline`}
      />
      <PipelineBoard columns={board.columns} canManage={canManage} />
    </PageContainer>
  );
}
