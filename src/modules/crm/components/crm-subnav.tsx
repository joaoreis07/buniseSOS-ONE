import type { Role } from "@prisma/client";
import {
  Calendar,
  GitBranch,
  LayoutDashboard,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import { hasPermission } from "@/shared/permissions/rbac";
import { CrmSectionHeader, PageTabs } from "@/shared/components/page-layout";

type CrmTab =
  | "customers"
  | "leads"
  | "opportunities"
  | "pipeline"
  | "activities"
  | "dashboard";

const TAB_ICONS = {
  dashboard: LayoutDashboard,
  customers: Users,
  leads: UserPlus,
  opportunities: Target,
  pipeline: GitBranch,
  activities: Calendar,
} as const;

const CRM_TABS: Array<{ key: CrmTab; segment: string; label: string; permission: Parameters<typeof hasPermission>[1] }> = [
  { key: "dashboard", segment: "dashboard", label: "Dashboard", permission: "crm:dashboard:view" },
  { key: "customers", segment: "", label: "Clientes", permission: "crm:view" },
  { key: "leads", segment: "leads", label: "Leads", permission: "crm:leads:view" },
  { key: "opportunities", segment: "opportunities", label: "Oportunidades", permission: "crm:opportunities:view" },
  { key: "pipeline", segment: "pipeline", label: "Funil", permission: "crm:pipeline:view" },
  { key: "activities", segment: "activities", label: "Atividades", permission: "crm:activities:view" },
];

export function CrmSubnav({
  role,
  active,
  showTitle = true,
  variant = "app",
}: {
  role?: Role;
  active: CrmTab;
  showTitle?: boolean;
  variant?: "app" | "demo";
}) {
  const base = variant === "demo" ? "/demo/crm" : "/app/crm";
  const items = CRM_TABS.filter((tab) =>
    variant === "demo" ? true : role ? hasPermission(role, tab.permission) : false,
  ).map((tab) => ({
    key: tab.key,
    href: tab.segment ? `${base}/${tab.segment}` : base,
    label: tab.label,
  }));

  if (items.length === 0) return null;

  return (
    <>
      {showTitle ? <CrmSectionHeader /> : null}
      <PageTabs
        active={active}
        items={items.map((item) => {
          const Icon = TAB_ICONS[item.key];
          return {
            id: item.key,
            href: item.href,
            label: item.label,
            icon: <Icon className="size-3.5" aria-hidden />,
          };
        })}
      />
    </>
  );
}
