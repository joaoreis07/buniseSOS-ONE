export const ROLE_LABELS = {
  ADMIN: "Administrador",
  MANAGER: "Gestor",
  SALES: "Vendas",
  FINANCE: "Financeiro",
  INVENTORY: "Estoque",
} as const;

export const INVITE_STATUS_LABELS = {
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  REVOKED: "Cancelado",
  EXPIRED: "Expirado",
} as const;

export const PERMISSION_LABELS: Record<string, string> = {
  "dashboard:view": "Ver dashboard",
  "crm:view": "Ver CRM",
  "crm:manage": "Gerenciar clientes",
  "crm:leads:view": "Ver leads",
  "crm:leads:manage": "Gerenciar leads",
  "crm:opportunities:view": "Ver oportunidades",
  "crm:opportunities:manage": "Gerenciar oportunidades",
  "crm:pipeline:view": "Ver funil",
  "crm:pipeline:manage": "Gerenciar funil",
  "crm:activities:view": "Ver atividades",
  "crm:activities:manage": "Gerenciar atividades",
  "crm:dashboard:view": "Ver dashboard CRM",
  "sales:view": "Ver vendas",
  "sales:create": "Criar vendas",
  "sales:manage": "Gerenciar vendas",
  "sales:cancel": "Cancelar vendas",
  "products:view": "Ver produtos",
  "products:manage": "Gerenciar produtos",
  "categories:view": "Ver categorias",
  "categories:manage": "Gerenciar categorias",
  "inventory:view": "Ver estoque",
  "inventory:manage": "Gerenciar estoque",
  "inventory:movements": "Movimentar estoque",
  "purchases:view": "Ver compras",
  "purchases:create": "Criar compras",
  "purchases:manage": "Gerenciar compras",
  "purchases:receive": "Receber compras",
  "purchases:cancel": "Cancelar compras",
  "suppliers:view": "Ver fornecedores",
  "suppliers:manage": "Gerenciar fornecedores",
  "finance:view": "Ver financeiro",
  "finance:manage": "Gerenciar financeiro",
  "finance:receive": "Receber pagamentos",
  "finance:cancel": "Cancelar contas",
  "dre:view": "Ver DRE",
  "ecommerce:view": "Ver e-commerce",
  "ecommerce:manage": "Gerenciar e-commerce",
  "reports:view": "Ver relatórios",
  "communications:view": "Ver comunicações",
  "communications:send": "Enviar comunicações",
  "communications:templates": "Gerenciar templates",
  "notifications:view": "Ver notificações",
  "settings:view": "Ver configurações",
  "settings:manage": "Gerenciar configurações",
  "team:view": "Ver equipe",
  "team:manage": "Gerenciar equipe",
  "billing:view": "Ver assinatura",
  "billing:manage": "Gerenciar assinatura",
  "billing:cancel": "Cancelar assinatura",
};

export const MEMBER_STATUS_LABELS = {
  active: "Ativo",
  inactive: "Inativo",
} as const;

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  LOGIN: "Acesso",
  INVITE_CREATE: "Convite criado",
  INVITE_RESEND: "Convite reenviado",
  INVITE_REVOKE: "Convite cancelado",
  INVITE_ACCEPT: "Convite aceito",
  MEMBER_ROLE_CHANGE: "Função alterada",
  MEMBER_DEACTIVATE: "Membro desativado",
  MEMBER_ACTIVATE: "Membro reativado",
  COMPANY_SETTINGS_UPDATED: "Configurações da empresa atualizadas",
  BRANDING_UPDATED: "Identidade visual atualizada",
  DOCUMENT_SETTINGS_UPDATED: "Documentos atualizados",
  NUMBERING_SETTINGS_UPDATED: "Numeração atualizada",
  LOGO_UPDATED: "Logo atualizada",
  DOCUMENT_GENERATED: "Documento gerado",
  RECEIPT_GENERATED: "Recibo gerado",
  SUBSCRIPTION_CREATED: "Assinatura criada",
  SUBSCRIPTION_ACTIVATED: "Assinatura ativada",
  SUBSCRIPTION_UPDATED: "Assinatura atualizada",
  SUBSCRIPTION_CANCELLED: "Assinatura cancelada",
  SUBSCRIPTION_PAST_DUE: "Assinatura em atraso",
  PAYMENT_CONFIRMED: "Pagamento de assinatura confirmado",
  PAYMENT_FAILED: "Pagamento de assinatura falhou",
};

export function formatDateTimeBR(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function permissionModule(permission: string): string {
  const [module] = permission.split(":");
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    crm: "CRM",
    sales: "Vendas",
    products: "Produtos",
    categories: "Categorias",
    inventory: "Estoque",
    purchases: "Compras",
    suppliers: "Fornecedores",
    finance: "Financeiro",
    dre: "DRE",
    ecommerce: "E-commerce",
    reports: "Relatórios",
    communications: "Comunicações",
    notifications: "Notificações",
    settings: "Configurações",
    team: "Equipe",
    billing: "Assinatura",
  };
  return labels[module] ?? module;
}
