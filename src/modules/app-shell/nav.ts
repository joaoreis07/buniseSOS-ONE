import type { Permission } from "@/shared/permissions/rbac";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Truck,
  Factory,
  Package,
  Warehouse,
  Wallet,
  FileSpreadsheet,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  permission: Permission;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const APP_NAV_GROUPS: NavGroup[] = [
  {
    label: "Visão geral",
    items: [
      {
        title: "Dashboard",
        href: "/app",
        permission: "dashboard:view",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Relacionamento",
    items: [
      { title: "CRM", href: "/app/crm", permission: "crm:view", icon: Users },
      {
        title: "Comunicações",
        href: "/app/communications",
        permission: "communications:view",
        icon: MessageSquare,
      },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Vendas", href: "/app/sales", permission: "sales:view", icon: ShoppingCart },
      { title: "Produtos", href: "/app/products", permission: "products:view", icon: Package },
      { title: "Estoque", href: "/app/inventory", permission: "inventory:view", icon: Warehouse },
      { title: "Compras", href: "/app/purchases", permission: "purchases:view", icon: Truck },
      {
        title: "Fornecedores",
        href: "/app/suppliers",
        permission: "suppliers:view",
        icon: Factory,
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Financeiro", href: "/app/finance", permission: "finance:view", icon: Wallet },
      {
        title: "Relatórios",
        href: "/app/reports",
        permission: "reports:view",
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    label: "Administração",
    items: [
      {
        title: "Configurações",
        href: "/app/settings",
        permission: "settings:view",
        icon: Settings,
      },
    ],
  },
];

export const APP_NAV_ITEMS = APP_NAV_GROUPS.flatMap((group) => group.items);
