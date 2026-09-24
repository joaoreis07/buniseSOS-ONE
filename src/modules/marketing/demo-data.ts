export const DEMO_NOTICE =
  "Demonstração pública — dados de exemplo. Nada aqui usa o banco de produção.";

export const DEMO_PLAN = {
  name: "BusinessOS One",
  price: "R$ 197/mês",
} as const;

export const DEMO_KPIS = [
  { label: "Faturamento", value: "R$ 24.580,00" },
  { label: "Vendas", value: "147" },
  { label: "A receber", value: "R$ 8.420,00" },
  { label: "Estoque baixo", value: "12" },
] as const;

/** Alinhado ao Figma — gráficos do dashboard demo */
export const DEMO_REVENUE_EXPENSE = [
  { month: "Abr", receita: 32400, despesa: 18200 },
  { month: "Mai", receita: 38700, despesa: 21000 },
  { month: "Jun", receita: 35200, despesa: 19800 },
  { month: "Jul", receita: 41800, despesa: 22400 },
  { month: "Ago", receita: 43300, despesa: 20100 },
  { month: "Set", receita: 48720, despesa: 21800 },
] as const;

export const DEMO_CATEGORY_BREAKDOWN = [
  { name: "Assinatura PRO", value: 32760 },
  { name: "Implantação", value: 8820 },
  { name: "Treinamento", value: 4320 },
  { name: "Produtos", value: 2820 },
] as const;

export const DEMO_SALES_CHART = [
  { label: "01/09", value: 4200 },
  { label: "05/09", value: 6800 },
  { label: "09/09", value: 5100 },
  { label: "12/09", value: 8900 },
  { label: "16/09", value: 7200 },
  { label: "18/09", value: 9500 },
  { label: "22/09", value: 6020 },
] as const;

export const DEMO_FREE_USAGE = [
  { label: "Clientes", used: 42, limit: 50, status: "warning" as const },
  { label: "Vendas / mês", used: 24, limit: 30, status: "warning" as const },
  { label: "Produtos", used: 18, limit: 30, status: "ok" as const },
  { label: "Leads", used: 14, limit: 20, status: "ok" as const },
  { label: "Oportunidades", used: 5, limit: 10, status: "ok" as const },
] as const;

export const DEMO_PENDING_ACTIVITIES = [
  {
    id: "demo-act-1",
    title: "Follow-up proposta Exportadora",
    type: "Ligação",
    client: "Exportadora Amazônica",
    dueDate: "23/09/2026",
  },
  {
    id: "demo-act-2",
    title: "Enviar contrato renovação",
    type: "E-mail",
    client: "Logtech Transportes",
    dueDate: "24/09/2026",
  },
  {
    id: "demo-act-3",
    title: "Confirmar reunião Dr. Marcos",
    type: "WhatsApp",
    client: "Dr. Marcos Oliveira",
    dueDate: "23/09/2026",
  },
] as const;

export const DEMO_CRM_FUNNEL = [
  { stage: "Prospecção", count: 12 },
  { stage: "Qualificação", count: 8 },
  { stage: "Proposta", count: 5 },
  { stage: "Negociação", count: 3 },
  { stage: "Fechamento", count: 2 },
] as const;

export const DEMO_LEADS = [
  {
    id: "demo-lead-1",
    name: "Ricardo Mendes",
    company: "Mendes & Associados",
    origin: "Indicação",
    status: "Qualificado",
    value: "R$ 12.000,00",
    owner: "João Silva",
  },
  {
    id: "demo-lead-2",
    name: "Patricia Alves",
    company: "Alves Contabilidade",
    origin: "Website",
    status: "Novo",
    value: "R$ 8.500,00",
    owner: "Maria Santos",
  },
  {
    id: "demo-lead-3",
    name: "Fernando Costa",
    company: "Costa Imóveis",
    origin: "WhatsApp",
    status: "Contatado",
    value: "R$ 25.000,00",
    owner: "João Silva",
  },
] as const;

export const DEMO_OPPORTUNITIES = [
  {
    id: "demo-opp-1",
    name: "Renovação anual — Plano PRO",
    client: "Exportadora Amazônica",
    stage: "Proposta",
    value: "R$ 197,00",
    probability: 80,
    closeDate: "15/10/2026",
    owner: "João Silva",
  },
  {
    id: "demo-opp-2",
    name: "Expansão de licenças",
    client: "Logtech Transportes",
    stage: "Negociação",
    value: "R$ 490,00",
    probability: 65,
    closeDate: "30/10/2026",
    owner: "Maria Santos",
  },
  {
    id: "demo-opp-3",
    name: "Implantação inicial — PME",
    client: "Ricardo Mendes",
    stage: "Qualificação",
    value: "R$ 197,00",
    probability: 40,
    closeDate: "15/11/2026",
    owner: "Carlos Pereira",
  },
] as const;

export const DEMO_CRM_ACTIVITIES = [
  {
    id: "demo-crm-act-1",
    title: "Follow-up proposta Exportadora",
    type: "Ligação",
    client: "Exportadora Amazônica",
    owner: "João Silva",
    dueDate: "23/09/2026",
    status: "Pendente",
  },
  {
    id: "demo-crm-act-2",
    title: "Enviar contrato renovação",
    type: "E-mail",
    client: "Logtech Transportes",
    owner: "Maria Santos",
    dueDate: "24/09/2026",
    status: "Pendente",
  },
  {
    id: "demo-crm-act-3",
    title: "Demo para Nunes Software",
    type: "Reunião",
    client: "Nunes Software",
    owner: "Carlos Pereira",
    dueDate: "22/09/2026",
    status: "Concluída",
  },
] as const;

export const DEMO_PIPELINE = [
  {
    stage: "NEW",
    label: "Prospecção",
    color: "border-slate-400",
    items: [
      {
        id: "demo-pipe-1",
        name: "Implantação PME",
        client: "Ricardo Mendes",
        value: "R$ 197,00",
        probability: 40,
      },
    ],
  },
  {
    stage: "QUALIFIED",
    label: "Qualificação",
    color: "border-blue-400",
    items: [
      {
        id: "demo-pipe-2",
        name: "Upgrade PRO",
        client: "Clínica Odonto Plus",
        value: "R$ 197,00",
        probability: 70,
      },
    ],
  },
  {
    stage: "PROPOSAL",
    label: "Proposta",
    color: "border-violet-400",
    items: [
      {
        id: "demo-pipe-3",
        name: "Renovação anual",
        client: "Exportadora Amazônica",
        value: "R$ 197,00",
        probability: 80,
      },
    ],
  },
  {
    stage: "NEGOTIATION",
    label: "Negociação",
    color: "border-amber-400",
    items: [
      {
        id: "demo-pipe-4",
        name: "Expansão licenças",
        client: "Logtech Transportes",
        value: "R$ 490,00",
        probability: 65,
      },
    ],
  },
] as const;

export const DEMO_CUSTOMERS = [
  {
    id: "demo-customer-ana",
    name: "Ana Costa",
    status: "Ativo",
    phone: "(11) 98888-1001",
    sales: 8,
    receivable: "R$ 450,00",
    activities: 3,
    history: [
      { label: "Venda #1042", value: "R$ 1.200,00" },
      { label: "Pagamento recebido", value: "Quitada" },
      { label: "Atividade: retorno comercial", value: "Concluída" },
    ],
  },
  {
    id: "demo-customer-bruno",
    name: "Bruno Lima",
    status: "Ativo",
    phone: "(11) 97777-2002",
    sales: 3,
    receivable: "R$ 1.890,00",
    activities: 1,
    history: [
      { label: "Venda #1108", value: "R$ 1.890,00" },
      { label: "Parcela 1/3", value: "Paga" },
      { label: "Atividade: proposta enviada", value: "Aberta" },
    ],
  },
  {
    id: "demo-customer-carla",
    name: "Carla Mendes",
    status: "Inativo",
    phone: "(21) 96666-3003",
    sales: 1,
    receivable: "R$ 0,00",
    activities: 0,
    history: [{ label: "Última venda", value: "Concluída em 2025" }],
  },
] as const;

export const DEMO_SALES = [
  {
    id: "demo-sale-1042",
    number: "#1042",
    customer: "Ana Costa",
    items: "Consulta / serviço",
    total: "R$ 1.200,00",
    payment: "À vista",
    status: "Concluída",
  },
  {
    id: "demo-sale-1108",
    number: "#1108",
    customer: "Bruno Lima",
    items: "Produto A · 2 un.",
    total: "R$ 1.890,00",
    payment: "Parcelado 3x",
    status: "Concluída",
  },
  {
    id: "demo-sale-1120",
    number: "#1120",
    customer: "Carla Mendes",
    items: "Produto B",
    total: "R$ 197,00",
    payment: "À vista",
    status: "Rascunho (exemplo)",
  },
] as const;

export const DEMO_CATEGORIES = [
  { id: "demo-cat-1", name: "Assinaturas", description: "Planos e licenças", productCount: 4 },
  { id: "demo-cat-2", name: "Serviços", description: "Consultorias e implantação", productCount: 6 },
  { id: "demo-cat-3", name: "Material", description: "Produtos físicos", productCount: 8 },
] as const;

export const DEMO_PRODUCT_CATALOG = [
  {
    id: "demo-prod-1",
    name: "Plano PRO Mensal",
    sku: "PRO-M-001",
    type: "SERVICE" as const,
    category: "Assinaturas",
    price: 197,
    stock: null as number | null,
    status: "ACTIVE" as const,
  },
  {
    id: "demo-prod-2",
    name: "Implantação inicial",
    sku: "SRV-IMP-01",
    type: "SERVICE" as const,
    category: "Serviços",
    price: 890,
    stock: null,
    status: "ACTIVE" as const,
  },
  {
    id: "demo-prod-3",
    name: "Produto A",
    sku: "PRD-A-001",
    type: "PRODUCT" as const,
    category: "Material",
    price: 49.9,
    stock: 42,
    status: "ACTIVE" as const,
  },
  {
    id: "demo-prod-4",
    name: "Produto B",
    sku: "PRD-B-002",
    type: "PRODUCT" as const,
    category: "Material",
    price: 35,
    stock: 8,
    status: "ACTIVE" as const,
  },
  {
    id: "demo-prod-5",
    name: "Produto C",
    sku: "PRD-C-003",
    type: "PRODUCT" as const,
    category: "Material",
    price: 22.5,
    stock: 0,
    status: "INACTIVE" as const,
  },
  {
    id: "demo-prod-6",
    name: "Treinamento remoto",
    sku: "SRV-TRE-01",
    type: "SERVICE" as const,
    category: "Serviços",
    price: 320,
    stock: null,
    status: "ACTIVE" as const,
  },
] as const;

export const DEMO_INVENTORY_ROWS = [
  {
    id: "demo-inv-1",
    name: "Produto A",
    sku: "PRD-A-001",
    quantity: 42,
    minimumQuantity: 10,
    costPrice: 19.05,
    stockLevel: "normal" as const,
  },
  {
    id: "demo-inv-2",
    name: "Produto B",
    sku: "PRD-B-002",
    quantity: 8,
    minimumQuantity: 10,
    costPrice: 21,
    stockLevel: "low" as const,
  },
  {
    id: "demo-inv-3",
    name: "Produto C",
    sku: "PRD-C-003",
    quantity: 0,
    minimumQuantity: 5,
    costPrice: 12.5,
    stockLevel: "out" as const,
  },
] as const;

export const DEMO_INVENTORY_SUMMARY = {
  productCount: 3,
  withStock: 2,
  lowStock: 1,
  outOfStock: 1,
  totalQuantity: 50,
  totalValue: 950.1,
} as const;

export const DEMO_FINANCE_KPIS = {
  openAmount: 1260,
  receivedAmount: 18100,
  overdueAmount: 350,
} as const;

export const DEMO_FINANCE_ROWS = [
  {
    id: "demo-fin-1",
    saleNumber: 1108,
    customer: "Bruno Lima",
    dueDate: "10/09/2026",
    totalAmount: 630,
    paidAmount: 630,
    remainingAmount: 0,
    status: "PAID" as const,
  },
  {
    id: "demo-fin-2",
    saleNumber: 1108,
    customer: "Bruno Lima",
    dueDate: "10/10/2026",
    totalAmount: 630,
    paidAmount: 315,
    remainingAmount: 315,
    status: "PARTIAL" as const,
  },
  {
    id: "demo-fin-3",
    saleNumber: 1108,
    customer: "Bruno Lima",
    dueDate: "10/11/2026",
    totalAmount: 630,
    paidAmount: 0,
    remainingAmount: 630,
    status: "PENDING" as const,
  },
  {
    id: "demo-fin-4",
    saleNumber: 1042,
    customer: "Ana Costa",
    dueDate: "05/09/2026",
    totalAmount: 350,
    paidAmount: 0,
    remainingAmount: 350,
    status: "OVERDUE" as const,
  },
] as const;

export const DEMO_PURCHASE_KPIS = {
  monthCount: 12,
  monthValue: 1220,
  receivedCount: 10,
  cancelledCount: 1,
} as const;

export const DEMO_PURCHASES = [
  {
    id: "demo-purchase-88",
    number: 88,
    supplier: "Fornecedor exemplo",
    purchasedAt: "18/09/2026",
    itemCount: 2,
    total: 800,
    status: "RECEIVED" as const,
    createdBy: "João Silva",
  },
  {
    id: "demo-purchase-91",
    number: 91,
    supplier: "Distribuidora Sul",
    purchasedAt: "20/09/2026",
    itemCount: 1,
    total: 420,
    status: "DRAFT" as const,
    createdBy: "Maria Santos",
  },
  {
    id: "demo-purchase-95",
    number: 95,
    supplier: "Atacado Norte",
    purchasedAt: "21/09/2026",
    itemCount: 3,
    total: 1150,
    status: "RECEIVED" as const,
    createdBy: "João Silva",
  },
] as const;

export const DEMO_REPORT_ROWS = [
  { indicator: "Vendas concluídas", period: "30 dias", value: "147" },
  { indicator: "Recebido", period: "30 dias", value: "R$ 18.100,00" },
  { indicator: "Compras recebidas", period: "30 dias", value: "12" },
  { indicator: "Itens em estoque", period: "hoje", value: "342" },
] as const;

export const DEMO_COMMUNICATIONS_HISTORY = [
  {
    id: "demo-comm-1",
    createdAt: "16/09/2026 14:32",
    channel: "WHATSAPP" as const,
    type: "MANUAL" as const,
    status: "SENT" as const,
    origin: "MANUAL" as const,
    subject: "Lembrete de parcela — Bruno Lima",
    customer: "Bruno Lima",
    author: "João Silva",
  },
  {
    id: "demo-comm-2",
    createdAt: "15/09/2026 09:10",
    channel: "EMAIL" as const,
    type: "FOLLOW_UP" as const,
    status: "DELIVERED" as const,
    origin: "MANUAL" as const,
    subject: "Proposta comercial — Ana Costa",
    customer: "Ana Costa",
    author: "Maria Santos",
  },
  {
    id: "demo-comm-3",
    createdAt: "14/09/2026 16:45",
    channel: "WHATSAPP" as const,
    type: "REMINDER" as const,
    status: "PREPARED" as const,
    origin: "FINANCE" as const,
    subject: "Cobrança venda #1108",
    customer: "Bruno Lima",
    author: "João Silva",
  },
] as const;

export const DEMO_COMMUNICATION_TEMPLATES = [
  {
    id: "demo-tpl-1",
    name: "Lembrete de parcela",
    channel: "WHATSAPP" as const,
    type: "REMINDER" as const,
    active: true,
    body: "Olá {{cliente}}, sua parcela de {{valor}} vence em {{vencimento}}. Qualquer dúvida, estamos à disposição.",
  },
  {
    id: "demo-tpl-2",
    name: "Follow-up comercial",
    channel: "WHATSAPP" as const,
    type: "FOLLOW_UP" as const,
    active: true,
    body: "Oi {{cliente}}, passando para saber se recebeu nossa proposta. Podemos conversar?",
  },
  {
    id: "demo-tpl-3",
    name: "Boas-vindas",
    channel: "EMAIL" as const,
    type: "MANUAL" as const,
    active: false,
    body: "Bem-vindo(a) à {{empresa}}! Estamos felizes em ter você conosco.",
  },
] as const;

export const DEMO_NOTIFICATIONS = [
  {
    id: "demo-notif-1",
    title: "Estoque baixo em 12 produtos",
    detail: "Revise o módulo Estoque para repor itens abaixo do mínimo.",
  },
  {
    id: "demo-notif-2",
    title: "Parcela vencida — Ana Costa",
    detail: "Conta a receber de R$ 350,00 venceu em 05/09/2026.",
  },
  {
    id: "demo-notif-3",
    title: "Nova venda concluída",
    detail: "Venda #1042 registrada para Ana Costa.",
  },
] as const;

export const DEMO_TEAM = [
  { id: "demo-user-admin", name: "Joana Admin", role: "ADMIN", status: "Ativo" },
  { id: "demo-user-sales", name: "Pedro Vendas", role: "SALES", status: "Ativo" },
  { id: "demo-user-fin", name: "Marina Financeiro", role: "FINANCE", status: "Convite pendente" },
] as const;
