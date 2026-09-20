import {
  FileSpreadsheet,
  LayoutDashboard,
  MessageSquare,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export const DEMO_MODULES = [
  "dashboard",
  "crm",
  "sales",
  "inventory",
  "finance",
  "purchases",
  "reports",
  "communications",
  "team",
] as const;

export type DemoModuleId = (typeof DEMO_MODULES)[number];

export const DEMO_NAV: Array<{
  id: DemoModuleId;
  href: string;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "dashboard", href: "/", label: "Dashboard", icon: LayoutDashboard },
  { id: "crm", href: "/demo/crm", label: "CRM", icon: Users },
  { id: "sales", href: "/demo/sales", label: "Vendas", icon: ShoppingCart },
  { id: "inventory", href: "/demo/inventory", label: "Estoque", icon: Warehouse },
  { id: "finance", href: "/demo/finance", label: "Financeiro", icon: Wallet },
  { id: "purchases", href: "/demo/purchases", label: "Compras", icon: Truck },
  { id: "reports", href: "/demo/reports", label: "Relatórios", icon: FileSpreadsheet },
  {
    id: "communications",
    href: "/demo/communications",
    label: "Comunicações",
    icon: MessageSquare,
  },
  { id: "team", href: "/demo/team", label: "Equipe", icon: UserCog },
];

export function isDemoModule(value: string): value is DemoModuleId {
  return (DEMO_MODULES as readonly string[]).includes(value);
}

export function demoHref(id: DemoModuleId): string {
  return id === "dashboard" ? "/" : `/demo/${id}`;
}
