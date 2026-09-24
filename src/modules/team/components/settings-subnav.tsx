import type { Role } from "@prisma/client";
import {
  Building2,
  CreditCard,
  FileText,
  Palette,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { can } from "@/shared/permissions/can";
import { ModulePageHeader, PageTabs } from "@/shared/components/page-layout";

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
    icon: <Building2 className="size-3.5" aria-hidden />,
    permission: "settings:view" as const,
  },
  {
    id: "branding" as const,
    href: "/app/settings/branding",
    title: "Identidade",
    icon: <Palette className="size-3.5" aria-hidden />,
    permission: "settings:view" as const,
  },
  {
    id: "documents" as const,
    href: "/app/settings/documents",
    title: "Documentos",
    icon: <FileText className="size-3.5" aria-hidden />,
    permission: "settings:view" as const,
  },
  {
    id: "preferences" as const,
    href: "/app/settings/preferences",
    title: "Preferências",
    icon: <SlidersHorizontal className="size-3.5" aria-hidden />,
    permission: "settings:view" as const,
  },
  {
    id: "team" as const,
    href: "/app/settings/team",
    title: "Equipe",
    icon: <Users className="size-3.5" aria-hidden />,
    permission: "team:view" as const,
  },
  {
    id: "permissions" as const,
    href: "/app/settings/permissions",
    title: "Permissões",
    icon: <Shield className="size-3.5" aria-hidden />,
    permission: "team:view" as const,
  },
  {
    id: "billing" as const,
    href: "/app/settings/billing",
    title: "Assinatura",
    icon: <CreditCard className="size-3.5" aria-hidden />,
    permission: "billing:view" as const,
  },
];

export function SettingsSubnav({
  role,
  active,
  variant = "app",
}: SettingsSubnavProps & { variant?: "app" | "demo" }) {
  const base = variant === "demo" ? "/demo/settings" : "/app/settings";
  const items = ITEMS.filter((item) =>
    variant === "demo" ? true : can(role, item.permission),
  ).map((item) => ({
    id: item.id,
    href:
      item.id === "company"
        ? base
        : `${base}/${item.id === "billing" ? "billing" : item.id}`,
    label: item.title,
    icon: item.icon,
  }));

  return (
    <>
      <ModulePageHeader
        title="Configurações"
        subtitle="Gerencie sua empresa, equipe e assinatura"
      />
      <PageTabs active={active} items={items} />
    </>
  );
}
