import type { Role } from "@prisma/client";
import { can } from "@/shared/permissions/can";
import { PageTabs } from "@/shared/components/page-layout";

type SettingsSubnavProps = {
  role: Role;
  active:
    | "company"
    | "branding"
    | "documents"
    | "preferences"
    | "team"
    | "permissions"
    | "billing";
};

const ITEMS = [
  {
    id: "company" as const,
    href: "/app/settings",
    title: "Empresa",
    permission: "settings:view" as const,
  },
  {
    id: "branding" as const,
    href: "/app/settings/branding",
    title: "Identidade",
    permission: "settings:view" as const,
  },
  {
    id: "documents" as const,
    href: "/app/settings/documents",
    title: "Documentos",
    permission: "settings:view" as const,
  },
  {
    id: "preferences" as const,
    href: "/app/settings/preferences",
    title: "Preferências",
    permission: "settings:view" as const,
  },
  {
    id: "team" as const,
    href: "/app/settings/team",
    title: "Equipe",
    permission: "team:view" as const,
  },
  {
    id: "permissions" as const,
    href: "/app/settings/permissions",
    title: "Permissões",
    permission: "team:view" as const,
  },
  {
    id: "billing" as const,
    href: "/app/settings/billing",
    title: "Assinatura",
    permission: "billing:view" as const,
  },
];

export function SettingsSubnav({ role, active }: SettingsSubnavProps) {
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
