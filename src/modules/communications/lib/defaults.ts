import type { CommunicationChannel, CommunicationType } from "@prisma/client";

export const DEFAULT_COMMUNICATION_TEMPLATES: Array<{
  name: string;
  channel: CommunicationChannel;
  type: CommunicationType;
  subject: string;
  body: string;
}> = [
  {
    name: "Resumo de venda",
    channel: "WHATSAPP",
    type: "TRANSACTIONAL",
    subject: "Resumo da venda",
    body: "Olá, {{customer.name}}.\nSua venda {{sale.number}} foi registrada no valor de {{sale.total}} em {{sale.date}}.",
  },
  {
    name: "Lembrete de parcela",
    channel: "WHATSAPP",
    type: "REMINDER",
    subject: "Lembrete de parcela",
    body: "Olá, {{customer.name}}.\nVocê possui uma parcela no valor de {{installment.remaining}} com vencimento em {{installment.dueDate}}.",
  },
  {
    name: "Follow-up",
    channel: "WHATSAPP",
    type: "FOLLOW_UP",
    subject: "Follow-up",
    body: "Olá, {{customer.name}}.\nEstamos à disposição. Qualquer dúvida, é só responder esta mensagem.",
  },
];
