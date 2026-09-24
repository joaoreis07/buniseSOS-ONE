import {
  Factory,
  FileSpreadsheet,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export const DEMO_MODULES = [
  "dashboard",
  "crm",
  "sales",
  "products",
  "inventory",
  "finance",
  "purchases",
  "suppliers",
  "reports",
  "communications",
  "settings",
] as const;

export type DemoModuleId = (typeof DEMO_MODULES)[number];

export type DemoNavItem = {
  id: DemoModuleId;
  href: string;
  label: string;
  icon: LucideIcon;
};

export type DemoNavGroup = {
  label: string;
  items: DemoNavItem[];
};

/** Same module set as before; grouped like the real app shell. */
export const DEMO_NAV_GROUPS: DemoNavGroup[] = [
  {
    label: "Visão geral",
    items: [
      { id: "dashboard", href: "/demo/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Relacionamento",
    items: [
      { id: "crm", href: "/demo/crm", label: "CRM", icon: Users },
      {
        id: "communications",
        href: "/demo/communications",
        label: "Comunicações",
        icon: MessageSquare,
      },
    ],
  },
  {
    label: "Operação",
    items: [
      { id: "sales", href: "/demo/sales", label: "Vendas", icon: ShoppingCart },
      { id: "products", href: "/demo/products", label: "Produtos", icon: Package },
      { id: "inventory", href: "/demo/inventory", label: "Estoque", icon: Warehouse },
      { id: "purchases", href: "/demo/purchases", label: "Compras", icon: Truck },
      { id: "suppliers", href: "/demo/suppliers", label: "Fornecedores", icon: Factory },
    ],
  },
  {
    label: "Gestão",
    items: [
      { id: "finance", href: "/demo/finance", label: "Financeiro", icon: Wallet },
      { id: "reports", href: "/demo/reports", label: "Relatórios", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Administração",
    items: [
      {
        id: "settings",
        href: "/demo/settings",
        label: "Configurações",
        icon: Settings,
      },
    ],
  },
];

export const DEMO_NAV: DemoNavItem[] = DEMO_NAV_GROUPS.flatMap((group) => group.items);

export function isDemoModule(value: string): value is DemoModuleId {
  return (DEMO_MODULES as readonly string[]).includes(value);
}

export function demoHref(id: DemoModuleId): string {
  return `/demo/${id}`;
}

export function demoModuleLabel(id: DemoModuleId): string {
  return DEMO_NAV.find((item) => item.id === id)?.label ?? id;
}
