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

export const salePaymentModeSchema = z.enum(["CASH", "INSTALLMENT"]);
export const installmentPeriodSchema = z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]);

export const saleItemInputSchema = z.object({
  productId: z.string().cuid("Produto inválido"),
  quantity: z.coerce
    .number()
    .int("Quantidade deve ser inteira")
    .positive("Quantidade deve ser maior que zero"),
  discountAmount: money("Desconto do item").default(0),
});

export const completeSaleSchema = z
  .object({
    customerId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
    paymentMethod: paymentMethodSchema.default("PIX"),
    paymentMode: salePaymentModeSchema.default("CASH"),
    installmentsCount: z.coerce.number().int().min(1).max(120).default(1),
    firstDueDate: z.preprocess(emptyToNull, z.string().nullable()).optional(),
    period: installmentPeriodSchema.default("MONTHLY"),
    discountAmount: money("Desconto geral").default(0),
    notes: optionalText(4000, "Observações"),
    items: z.array(saleItemInputSchema).min(1, "Informe ao menos um item"),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMode !== "INSTALLMENT") return;
    if (!data.firstDueDate) {
      ctx.addIssue({
        code: "custom",
        path: ["firstDueDate"],
        message: "Informe o primeiro vencimento para venda parcelada",
      });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.firstDueDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["firstDueDate"],
        message: "Data de vencimento inválida",
      });
    }
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

type CompleteSaleOutput = z.infer<typeof completeSaleSchema>;
export type CompleteSaleInput = Omit<
  CompleteSaleOutput,
  "paymentMode" | "installmentsCount" | "firstDueDate" | "period"
> & {
  paymentMode?: CompleteSaleOutput["paymentMode"];
  installmentsCount?: number;
  firstDueDate?: string | null;
  period?: CompleteSaleOutput["period"];
};
export type SaleListQuery = z.infer<typeof saleListQuerySchema>;
export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
