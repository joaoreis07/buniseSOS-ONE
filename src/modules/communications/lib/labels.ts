export const COMMUNICATION_CHANNEL_LABELS = {
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  SMS: "SMS",
  INTERNAL: "Interna",
  OTHER: "Outro",
} as const;

export const COMMUNICATION_TYPE_LABELS = {
  MANUAL: "Manual",
  REMINDER: "Lembrete",
  FOLLOW_UP: "Follow-up",
  TRANSACTIONAL: "Transacional",
  OTHER: "Outro",
} as const;

export const COMMUNICATION_STATUS_LABELS = {
  PREPARED: "Preparada",
  OPENED: "Iniciada",
  SENT: "Enviada",
  DELIVERED: "Entregue",
  FAILED: "Falhou",
  CANCELLED: "Cancelada",
} as const;

export const COMMUNICATION_ORIGIN_LABELS = {
  CRM: "CRM",
  SALE: "Venda",
  FINANCE: "Financeiro",
  ACTIVITY: "Atividade",
  MANUAL: "Manual",
  SYSTEM: "Sistema",
} as const;

export const NOTIFICATION_TYPE_LABELS = {
  LOW_STOCK: "Estoque baixo",
  OUT_OF_STOCK: "Sem estoque",
  OVERDUE_RECEIVABLE: "Parcela vencida",
  PAYMENT_RECEIVED: "Pagamento recebido",
  SALE_COMPLETED: "Venda concluída",
  PURCHASE_RECEIVED: "Compra recebida",
  TASK_ASSIGNED: "Atividade atribuída",
  SYSTEM: "Sistema",
  BILLING: "Assinatura",
} as const;

export const WHATSAPP_MANUAL_DISCLAIMER =
  "O WhatsApp será aberto para você concluir o envio. O sistema não envia a mensagem automaticamente.";
