import { z } from "zod";
import { paymentMethodSchema } from "@/modules/sales/schemas/sale.schemas";
import { PERIOD_PRESETS } from "@/modules/reports/lib/period";

const emptyToNull = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length === 0 ? null : text;
};

export const dashboardQuerySchema = z.object({
  preset: z.enum(PERIOD_PRESETS).default("last_30"),
  from: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  to: z.preprocess(emptyToNull, z.string().nullable()).optional(),
});

export const reportTypeSchema = z.enum([
  "sales",
  "finance",
  "inventory",
  "purchases",
]);

export const salesReportQuerySchema = z.object({
  preset: z.enum(PERIOD_PRESETS).default("last_30"),
  from: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  to: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  productId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  customerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  sellerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  status: z.preprocess(
    emptyToNull,
    z.enum(["COMPLETED", "CANCELLED"]).nullable(),
  ).optional(),
  paymentMethod: z.preprocess(
    emptyToNull,
    paymentMethodSchema.nullable(),
  ).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const financeReportQuerySchema = z.object({
  preset: z.enum(PERIOD_PRESETS).default("last_30"),
  from: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  to: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  status: z.preprocess(
    emptyToNull,
    z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).nullable(),
  ).optional(),
  customerId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  paymentMethod: z.preprocess(
    emptyToNull,
    paymentMethodSchema.nullable(),
  ).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const inventoryReportQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  stock: z.preprocess(
    emptyToNull,
    z.enum(["low", "out", "all"]).nullable(),
  ).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const purchasesReportQuerySchema = z.object({
  preset: z.enum(PERIOD_PRESETS).default("last_30"),
  from: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  to: z.preprocess(emptyToNull, z.string().nullable()).optional(),
  supplierId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  productId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  status: z.preprocess(
    emptyToNull,
    z.enum(["DRAFT", "RECEIVED", "CANCELLED"]).nullable(),
  ).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type SalesReportQuery = z.infer<typeof salesReportQuerySchema>;
export type FinanceReportQuery = z.infer<typeof financeReportQuerySchema>;
export type InventoryReportQuery = z.infer<typeof inventoryReportQuerySchema>;
export type PurchasesReportQuery = z.infer<typeof purchasesReportQuerySchema>;
export type ReportType = z.infer<typeof reportTypeSchema>;
