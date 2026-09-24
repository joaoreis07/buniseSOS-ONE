import { requirePermission } from "@/shared/auth/session";
import { getCrmDashboard } from "@/modules/crm/services/crm-dashboard.service";
import { CrmSubnav } from "@/modules/crm/components/crm-subnav";
import { CrmDashboardView } from "@/modules/crm/components/crm-dashboard-view";
import { PageContainer } from "@/shared/components/page-layout";

export default async function CrmDashboardPage() {
  const user = await requirePermission("crm:dashboard:view");
  const data = await getCrmDashboard({
    companyId: user.companyId,
    role: user.role,
  });

  return (
    <PageContainer>
      <CrmSubnav role={user.role} active="dashboard" />
      <CrmDashboardView data={data} />
    </PageContainer>
  );
}
