import type { Permission } from "@/shared/permissions/rbac";
import {
  LayoutDashboard,
  Users,
  Contact,
  ShoppingCart,
  Package,
  Warehouse,
  Wallet,
  PieChart,
  Store,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  permission: Permission;
  icon: LucideIcon;
};

export const APP_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/app", permission: "dashboard:view", icon: LayoutDashboard },
  { title: "CRM", href: "/app/crm", permission: "crm:view", icon: Users },
  { title: "Leads", href: "/app/crm/leads", permission: "crm:leads:view", icon: Contact },
  { title: "Vendas", href: "/app/sales", permission: "sales:view", icon: ShoppingCart },
  { title: "Produtos", href: "/app/products", permission: "products:view", icon: Package },
  { title: "Estoque", href: "/app/inventory", permission: "inventory:view", icon: Warehouse },
  { title: "Financeiro", href: "/app/finance", permission: "finance:view", icon: Wallet },
  { title: "DRE", href: "/app/dre", permission: "dre:view", icon: PieChart },
  { title: "E-commerce", href: "/app/ecommerce", permission: "ecommerce:view", icon: Store },
  { title: "Configurações", href: "/app/settings", permission: "settings:view", icon: Settings },
];
