import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length === 0 ? null : text;
};

const optionalText = (max: number, label: string) =>
  z.preprocess(
    emptyToNull,
    z.string().max(max, `${label} muito longo`).nullable(),
  );

export const activityTypeSchema = z.enum([
  "CALL",
  "MEETING",
  "WHATSAPP",
  "EMAIL",
  "TASK",
  "NOTE",
]);

export const activityStatusSchema = z.enum([
  "PENDING",
  "COMPLETED",
  "CANCELLED",
]);

const dueAtSchema = z.preprocess((value) => {
  const text = emptyToNull(value);
  return text;
}, z.string().nullable()).refine(
  (value) => {
    if (!value) return true;
    return !Number.isNaN(Date.parse(value));
  },
  { message: "Data/hora inválida" },
);

export const activityFormSchema = z
  .object({
    title: z.string().trim().min(2, "Título muito curto").max(160),
    description: optionalText(4000, "Descrição"),
    type: activityTypeSchema.default("TASK"),
    status: activityStatusSchema.default("PENDING"),
    ownerId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
    dueAt: dueAtSchema,
    customerId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
    leadId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
    opportunityId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
  })
  .refine(
    (data) => Boolean(data.customerId || data.leadId || data.opportunityId),
    {
      message: "Vincule a atividade a um cliente, lead ou oportunidade",
      path: ["customerId"],
    },
  );

export const activityListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  status: z.preprocess(emptyToNull, activityStatusSchema.nullable()).optional(),
  type: z.preprocess(emptyToNull, activityTypeSchema.nullable()).optional(),
  ownerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  customerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  leadId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  opportunityId: z
    .preprocess(emptyToNull, z.string().cuid().nullable())
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type ActivityFormInput = z.infer<typeof activityFormSchema>;
export type ActivityListQuery = z.infer<typeof activityListQuerySchema>;
