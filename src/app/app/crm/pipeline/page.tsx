import { requirePermission } from "@/shared/auth/session";
import {
  canManagePipeline,
  getPipelineBoard,
} from "@/modules/crm/services/pipeline.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { PipelineBoard } from "@/modules/crm/components/pipeline-board";

export default async function PipelinePage() {
  const user = await requirePermission("crm:pipeline:view");
  const board = await getPipelineBoard({
    companyId: user.companyId,
    role: user.role,
  });
  const canManage = canManagePipeline(user.role);

  return (
    <div className="space-y-6">
      <CrmSubnav role={user.role} active="pipeline" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Funil</h1>
        <p className="text-muted-foreground">
          Board de oportunidades por estágio · {board.total} no pipeline
        </p>
      </div>
      <PipelineBoard columns={board.columns} canManage={canManage} />
    </div>
  );
}
