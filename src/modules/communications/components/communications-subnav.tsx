import type { Role } from "@prisma/client";
import { can } from "@/shared/permissions/can";
import { PageTabs } from "@/shared/components/page-layout";

type CommunicationsSubnavProps = {
  role?: Role;
  active: "history" | "templates" | "compose";
};

const ITEMS = [
  { id: "history" as const, segment: "", title: "Histórico", permission: "communications:view" as const },
  { id: "compose" as const, segment: "new", title: "Preparar WhatsApp", permission: "communications:send" as const },
  { id: "templates" as const, segment: "templates", title: "Templates", permission: "communications:view" as const },
];

export function CommunicationsSubnav({
  role,
  active,
  variant = "app",
}: CommunicationsSubnavProps & { variant?: "app" | "demo" }) {
  const base = variant === "demo" ? "/demo/communications" : "/app/communications";
  return (
    <PageTabs
      active={active}
      items={ITEMS.filter((item) =>
        variant === "demo" ? true : role ? can(role, item.permission) : false,
      ).map((item) => ({
        id: item.id,
        href: item.segment ? `${base}/${item.segment}` : base,
        label: item.title,
      }))}
    />
  );
}
