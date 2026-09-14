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

export const purchaseStatusSchema = z.enum(["DRAFT", "RECEIVED", "CANCELLED"]);

export const purchaseItemInputSchema = z.object({
  productId: z.string().cuid("Produto inválido"),
  quantity: z.coerce
    .number()
    .int("Quantidade deve ser inteira")
    .positive("Quantidade deve ser maior que zero"),
  unitCost: money("Custo unitário"),
  discountAmount: money("Desconto do item").default(0),
});

export const purchaseFormSchema = z.object({
  supplierId: z.string().cuid("Fornecedor inválido"),
  discountAmount: money("Desconto geral").default(0),
  notes: optionalText(4000, "Observações"),
  items: z.array(purchaseItemInputSchema).min(1, "Informe ao menos um item"),
});

export const purchaseListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  status: z.preprocess(emptyToNull, purchaseStatusSchema.nullable()).optional(),
  supplierId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  from: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  to: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type PurchaseFormInput = z.infer<typeof purchaseFormSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemInputSchema>;
export type PurchaseListQuery = z.infer<typeof purchaseListQuerySchema>;
