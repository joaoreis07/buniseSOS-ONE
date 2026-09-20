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

export const DEMO_PRODUCTS = [
  {
    id: "demo-product-a",
    name: "Produto A",
    quantity: 42,
    minimum: 10,
    level: "Normal",
    movements: [
      { type: "Entrada", qty: "+20" },
      { type: "Saída por venda", qty: "−1" },
    ],
  },
  {
    id: "demo-product-b",
    name: "Produto B",
    quantity: 8,
    minimum: 10,
    level: "Estoque baixo",
    movements: [
      { type: "Ajuste", qty: "−2" },
      { type: "Saída por venda", qty: "−1" },
    ],
  },
  {
    id: "demo-product-c",
    name: "Produto C",
    quantity: 0,
    minimum: 5,
    level: "Sem estoque",
    movements: [{ type: "Perda", qty: "−1" }],
  },
] as const;

export const DEMO_RECEIVABLES = [
  {
    id: "demo-fin-1",
    title: "Parcela 1/3 · Bruno Lima",
    due: "10/09/2026",
    amount: "R$ 630,00",
    status: "Quitada",
  },
  {
    id: "demo-fin-2",
    title: "Parcela 2/3 · Bruno Lima",
    due: "10/10/2026",
    amount: "R$ 630,00",
    status: "Parcial",
  },
  {
    id: "demo-fin-3",
    title: "Parcela 3/3 · Bruno Lima",
    due: "10/11/2026",
    amount: "R$ 630,00",
    status: "Pendente",
  },
  {
    id: "demo-fin-4",
    title: "Conta · Ana Costa",
    due: "05/09/2026",
    amount: "R$ 350,00",
    status: "Vencida",
  },
] as const;

export const DEMO_PURCHASES = [
  {
    id: "demo-purchase-88",
    number: "#88",
    supplier: "Fornecedor exemplo",
    items: "Produto A · 20 un.",
    cost: "R$ 800,00",
    status: "Recebida",
    stock: "Entrada registrada",
  },
  {
    id: "demo-purchase-91",
    number: "#91",
    supplier: "Distribuidora Sul",
    items: "Produto B · 10 un.",
    cost: "R$ 420,00",
    status: "Pendente",
    stock: "Aguardando recebimento",
  },
] as const;

export const DEMO_REPORT_ROWS = [
  { indicator: "Vendas concluídas", period: "30 dias", value: "147" },
  { indicator: "Recebido", period: "30 dias", value: "R$ 18.100,00" },
  { indicator: "Compras recebidas", period: "30 dias", value: "12" },
  { indicator: "Itens em estoque", period: "hoje", value: "342" },
] as const;

export const DEMO_COMMUNICATIONS = [
  {
    id: "demo-comm-1",
    title: "Template: lembrete de parcela",
    detail: "WhatsApp manual · nenhum envio real nesta demonstração",
  },
  {
    id: "demo-comm-2",
    title: "Histórico: Ana Costa",
    detail: "Registro de exemplo · 16/09/2026",
  },
  {
    id: "demo-comm-3",
    title: "Notificação interna",
    detail: "Estoque baixo em 12 produtos",
  },
] as const;

export const DEMO_TEAM = [
  { id: "demo-user-admin", name: "Joana Admin", role: "ADMIN", status: "Ativo" },
  { id: "demo-user-sales", name: "Pedro Vendas", role: "SALES", status: "Ativo" },
  { id: "demo-user-fin", name: "Marina Financeiro", role: "FINANCE", status: "Convite pendente" },
] as const;
