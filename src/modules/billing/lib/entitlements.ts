export type PlanFeature =
  | "users"
  | "customers"
  | "products"
  | "leads"
  | "opportunities"
  | "sales_month"
  | "communications_month"
  | "suppliers"
  | "purchases_month"
  | "open_installments";

export const FREE_LIMITS: Record<PlanFeature, number> = {
  users: 1,
  customers: 50,
  products: 30,
  leads: 20,
  opportunities: 10,
  sales_month: 30,
  communications_month: 20,
  suppliers: 10,
  purchases_month: 10,
  open_installments: 20,
};

export type UsageSnapshot = {
  feature: PlanFeature;
  label: string;
  used: number;
  limit: number | null;
  percent: number;
  status: "ok" | "warning" | "blocked";
};

export function usageStatus(used: number, limit: number | null): UsageSnapshot["status"] {
  if (limit == null) return "ok";
  if (used >= limit) return "blocked";
  if (used / limit >= 0.8) return "warning";
  return "ok";
}

export function buildUsage(feature: PlanFeature, label: string, used: number, limit: number | null): UsageSnapshot {
  return {
    feature,
    label,
    used,
    limit,
    percent: limit ? Math.min(100, Math.round((used / limit) * 100)) : 0,
    status: usageStatus(used, limit),
  };
}

export const FEATURE_LABELS: Record<PlanFeature, string> = {
  users: "Usuários",
  customers: "Clientes",
  products: "Produtos",
  leads: "Leads",
  opportunities: "Oportunidades",
  sales_month: "Vendas/mês",
  communications_month: "Comunicações",
  suppliers: "Fornecedores",
  purchases_month: "Compras/mês",
  open_installments: "Parcelas abertas",
};
