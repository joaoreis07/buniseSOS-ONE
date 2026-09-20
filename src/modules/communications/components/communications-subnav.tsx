import type { Role } from "@prisma/client";
import { can } from "@/shared/permissions/can";
import { PageTabs } from "@/shared/components/page-layout";

type CommunicationsSubnavProps = {
  role: Role;
  active: "history" | "templates" | "compose";
};

const ITEMS = [
  { id: "history" as const, href: "/app/communications", title: "Histórico", permission: "communications:view" as const },
  { id: "compose" as const, href: "/app/communications/new", title: "Preparar WhatsApp", permission: "communications:send" as const },
  { id: "templates" as const, href: "/app/communications/templates", title: "Templates", permission: "communications:view" as const },
];

export function CommunicationsSubnav({ role, active }: CommunicationsSubnavProps) {
  return (
    <PageTabs
      active={active}
      items={ITEMS.filter((item) => can(role, item.permission)).map((item) => ({
        id: item.id,
        href: item.href,
        label: item.title,
      }))}
    />
  );
}
