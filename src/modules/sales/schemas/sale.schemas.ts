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

const money = (label: string) =>
  z.coerce
    .number({ message: `${label} inválido` })
    .finite(`${label} inválido`)
    .min(0, `${label} não pode ser negativo`);

export const paymentMethodSchema = z.enum([
  "CASH",
  "PIX",
  "CARD",
  "CARD_CREDIT",
  "CARD_DEBIT",
  "TED",
  "OTHER",
]);

export const saleStatusSchema = z.enum(["DRAFT", "COMPLETED", "CANCELLED"]);

export const saleItemInputSchema = z.object({
  productId: z.string().cuid("Produto inválido"),
  quantity: z.coerce
    .number()
    .int("Quantidade deve ser inteira")
    .positive("Quantidade deve ser maior que zero"),
  discountAmount: money("Desconto do item").default(0),
});

export const completeSaleSchema = z.object({
  customerId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
  paymentMethod: paymentMethodSchema.default("PIX"),
  discountAmount: money("Desconto geral").default(0),
  notes: optionalText(4000, "Observações"),
  items: z.array(saleItemInputSchema).min(1, "Informe ao menos um item"),
});

export const saleListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  status: z.preprocess(emptyToNull, saleStatusSchema.nullable()).optional(),
  customerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  sellerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  from: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  to: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CompleteSaleInput = z.infer<typeof completeSaleSchema>;
export type SaleListQuery = z.infer<typeof saleListQuerySchema>;
export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
