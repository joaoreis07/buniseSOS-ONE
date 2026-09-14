import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length === 0 ? null : text;
};

export const communicationChannelSchema = z.enum([
  "WHATSAPP",
  "EMAIL",
  "SMS",
  "INTERNAL",
  "OTHER",
]);
export const communicationTypeSchema = z.enum([
  "MANUAL",
  "REMINDER",
  "FOLLOW_UP",
  "TRANSACTIONAL",
  "OTHER",
]);
export const communicationStatusSchema = z.enum([
  "PREPARED",
  "OPENED",
  "SENT",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
]);
export const communicationOriginSchema = z.enum([
  "CRM",
  "SALE",
  "FINANCE",
  "ACTIVITY",
  "MANUAL",
  "SYSTEM",
]);

export const templateFormSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  channel: communicationChannelSchema.default("WHATSAPP"),
  type: communicationTypeSchema.default("MANUAL"),
  subject: z.preprocess(emptyToNull, z.string().max(160).nullable()),
  body: z.string().trim().min(1, "Mensagem obrigatória").max(4000),
  active: z.coerce.boolean().default(true),
});

export const communicationListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  customerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  userId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  channel: z.preprocess(emptyToNull, communicationChannelSchema.nullable()).optional(),
  type: z.preprocess(emptyToNull, communicationTypeSchema.nullable()).optional(),
  status: z.preprocess(emptyToNull, communicationStatusSchema.nullable()).optional(),
  origin: z.preprocess(emptyToNull, communicationOriginSchema.nullable()).optional(),
  from: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  to: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const composeIntentSchema = z.enum(["sale", "charge", "followup", "manual"]);

export const prepareCommunicationSchema = z.object({
  customerId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
  templateId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
  saleId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
  installmentId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
  activityId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
  channel: communicationChannelSchema.default("WHATSAPP"),
  type: communicationTypeSchema.default("MANUAL"),
  origin: communicationOriginSchema.default("MANUAL"),
  subject: z.preprocess(emptyToNull, z.string().max(160).nullable()),
  body: z.string().trim().min(1, "Mensagem obrigatória").max(4000),
  recipient: z.preprocess(emptyToNull, z.string().max(40).nullable()),
  intent: z.preprocess(emptyToNull, composeIntentSchema.nullable()).optional(),
});

export const recordManualCommunicationSchema = z.object({
  customerId: z.string().cuid("Cliente inválido"),
  channel: communicationChannelSchema.default("WHATSAPP"),
  type: communicationTypeSchema.default("MANUAL"),
  subject: z.preprocess(emptyToNull, z.string().max(160).nullable()),
  body: z.string().trim().min(1, "Mensagem obrigatória").max(4000),
  recipient: z.preprocess(emptyToNull, z.string().max(40).nullable()),
  activityId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
});

export const notificationListQuerySchema = z.object({
  unread: z.enum(["1", "true"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type TemplateFormInput = z.infer<typeof templateFormSchema>;
export type CommunicationListQuery = z.infer<typeof communicationListQuerySchema>;
export type PrepareCommunicationInput = z.infer<typeof prepareCommunicationSchema>;
export type RecordManualCommunicationInput = z.infer<
  typeof recordManualCommunicationSchema
>;
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
