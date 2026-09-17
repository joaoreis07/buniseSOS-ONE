export const LANDING_NAV = [
  { href: "#produto", label: "Produto" },
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
] as const;

export const PRODUCT_MODULES = [
  "CRM",
  "Vendas",
  "Estoque",
  "Financeiro",
  "Compras",
  "Relatórios",
  "Equipe",
  "Comunicações",
] as const;

export const FEATURE_CARDS = [
  {
    title: "CRM",
    description:
      "Centralize clientes, histórico, atividades e relacionamento.",
  },
  {
    title: "Vendas",
    description:
      "Registre vendas, pagamentos e acompanhe sua operação comercial.",
  },
  {
    title: "Estoque",
    description:
      "Controle entradas, saídas, estoque mínimo e movimentações.",
  },
  {
    title: "Financeiro",
    description:
      "Acompanhe contas a receber, parcelas, pagamentos e vencimentos.",
  },
  {
    title: "Compras",
    description:
      "Controle fornecedores, compras, custos e recebimento de mercadorias.",
  },
  {
    title: "Relatórios",
    description:
      "Entenda vendas, financeiro, estoque e compras com indicadores e relatórios.",
  },
  {
    title: "Equipe",
    description: "Gerencie usuários, funções e permissões da sua empresa.",
  },
  {
    title: "Comunicações",
    description:
      "Organize comunicações, templates, WhatsApp manual e notificações.",
  },
] as const;

export const PLAN_FEATURES = [
  "CRM e clientes",
  "Vendas, produtos e serviços",
  "Estoque e movimentações",
  "Contas a receber e parcelas",
  "Compras e fornecedores",
  "Dashboard, relatórios e exportação CSV",
  "Comunicações, templates e WhatsApp manual",
  "Equipe, convites e permissões",
  "Branding, documentos e recibos",
] as const;

export const SECURITY_ITEMS = [
  {
    title: "Controle de acesso",
    description: "Permissões por função (RBAC) no servidor.",
  },
  {
    title: "Dados separados",
    description: "Cada empresa opera no próprio tenant (companyId).",
  },
  {
    title: "Segurança",
    description: "Autenticação e autorização server-side.",
  },
  {
    title: "Histórico",
    description: "Auditoria de operações importantes da empresa.",
  },
] as const;

export const FAQS = [
  {
    question: "O que é o BusinessOS One?",
    answer:
      "É um sistema web de gestão para a sua empresa: CRM, vendas, estoque, financeiro (contas a receber), compras, relatórios, comunicações e equipe, no mesmo lugar.",
  },
  {
    question: "Quais módulos estão disponíveis?",
    answer:
      "CRM (clientes, leads, oportunidades, funil e atividades), vendas, produtos, estoque, compras, fornecedores, contas a receber, dashboard, relatórios com CSV, comunicações, notificações, equipe com permissões, configurações, branding, documentos e assinatura do produto.",
  },
  {
    question: "Quanto custa?",
    answer: "R$ 197 por mês.",
  },
  {
    question: "Preciso instalar alguma coisa?",
    answer:
      "Não. O BusinessOS One é uma aplicação web. Você acessa pelo navegador, no computador ou no celular.",
  },
  {
    question: "Posso conhecer o sistema antes?",
    answer:
      "Sim. A demonstração pública mostra as telas do produto com dados de exemplo, sem usar o banco de produção.",
  },
  {
    question: "Como funciona o pagamento?",
    answer:
      "Depois de criar a conta, um administrador inicia a assinatura mensal em Configurações → Assinatura. O pagamento é feito online. Esta página não processa cobrança.",
  },
  {
    question: "Posso cancelar minha assinatura?",
    answer:
      "Sim. Um administrador pode cancelar a assinatura nas configurações da empresa. Não há fidelidade configurada no sistema.",
  },
] as const;
