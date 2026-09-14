import { z } from "zod";
import { paymentMethodSchema } from "@/modules/sales/schemas/sale.schemas";

const emptyToNull = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

export const receivableStatusSchema = z.enum([
  "PENDING",
  "PARTIAL",
  "PAID",
  "OVERDUE",
  "CANCELLED",
]);

export const receivePaymentSchema = z.object({
  installmentId: z.string().cuid("Parcela inválida"),
  amount: z.coerce.number().finite("Valor inválido").positive("Informe um valor maior que zero"),
  paymentMethod: paymentMethodSchema,
  notes: z.preprocess(emptyToNull, z.string().max(2000, "Observações muito longas").nullable()),
});

export const financeListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  status: z.preprocess(emptyToNull, receivableStatusSchema.nullable()).optional(),
  customerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type ReceivePaymentInput = z.infer<typeof receivePaymentSchema>;
export type FinanceListQuery = z.infer<typeof financeListQuerySchema>;
