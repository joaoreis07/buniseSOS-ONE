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

export const opportunityStageSchema = z.enum([
  "NEW",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

const estimatedValueSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const normalized = String(value).trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().nonnegative("Valor estimado inválido").nullable());

const probabilitySchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return 10;
  if (typeof value === "number") return value;
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().int().min(0, "Probabilidade mínima: 0").max(100, "Probabilidade máxima: 100"));

const expectedCloseDateSchema = z.preprocess((value) => {
  const text = emptyToNull(value);
  return text;
}, z.string().nullable()).refine(
  (value) => {
    if (!value) return true;
    return !Number.isNaN(Date.parse(value));
  },
  { message: "Data de previsão inválida" },
);

export const opportunityFormSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(160),
  leadId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
  customerId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
  ownerId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
  stage: opportunityStageSchema.default("NEW"),
  estimatedValue: estimatedValueSchema,
  probability: probabilitySchema,
  expectedCloseDate: expectedCloseDateSchema,
  notes: optionalText(4000, "Observações"),
});

export const opportunityListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  stage: z.preprocess(emptyToNull, opportunityStageSchema.nullable()).optional(),
  ownerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  leadId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  customerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  createdFrom: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  createdTo: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type OpportunityFormInput = z.infer<typeof opportunityFormSchema>;
export type OpportunityListQuery = z.infer<typeof opportunityListQuerySchema>;
