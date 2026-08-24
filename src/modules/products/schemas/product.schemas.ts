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

const moneySchema = (label: string) =>
  z.preprocess((value) => {
    if (value === null || value === undefined || value === "") return "0";
    return String(value).replace(",", ".").trim();
  }, z.string()).pipe(
    z
      .string()
      .refine((v) => /^-?\d+(\.\d{1,2})?$/.test(v), `${label} inválido`)
      .transform((v) => Number(v))
      .refine((v) => Number.isFinite(v), `${label} inválido`)
      .refine((v) => v >= 0, `${label} não pode ser negativo`),
  );

export const productTypeSchema = z.enum(["PRODUCT", "SERVICE"]);
export const productStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

/** Image reference: HTTPS URL or future local upload path. Max 2KB. */
export const productImageUrlSchema = z.preprocess(emptyToNull, z.string().nullable()).superRefine(
  (value, ctx) => {
    if (!value) return;
    if (value.length > 2048) {
      ctx.addIssue({ code: "custom", message: "URL da imagem muito longa" });
      return;
    }
    if (value.startsWith("data:")) {
      ctx.addIssue({
        code: "custom",
        message: "Envie apenas a referência/URL da imagem (não data URL)",
      });
      return;
    }
    const ok =
      /^https?:\/\/.+/i.test(value) ||
      /^\/uploads\/products\/.+/i.test(value);
    if (!ok) {
      ctx.addIssue({
        code: "custom",
        message:
          "Imagem deve ser URL http(s) ou caminho /uploads/products/…",
      });
    }
    if (/\.(exe|js|html|php|svg)(\?|$)/i.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Tipo de arquivo de imagem não permitido na referência",
      });
    }
  },
);

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(160),
  sku: z
    .string()
    .trim()
    .min(1, "SKU obrigatório")
    .max(64, "SKU muito longo")
    .regex(/^[A-Za-z0-9._\-]+$/, "SKU inválido"),
  barcode: optionalText(64, "Código de barras"),
  description: optionalText(4000, "Descrição"),
  type: productTypeSchema.default("PRODUCT"),
  categoryId: z.preprocess(emptyToNull, z.string().cuid().nullable()),
  costPrice: moneySchema("Preço de custo"),
  salePrice: moneySchema("Preço de venda"),
  status: productStatusSchema.default("ACTIVE"),
  imageUrl: productImageUrlSchema,
});

export const productListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  sku: z.preprocess(emptyToNull, z.string().max(64).nullable()).optional(),
  barcode: z.preprocess(emptyToNull, z.string().max(64).nullable()).optional(),
  categoryId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  type: z.preprocess(emptyToNull, productTypeSchema.nullable()).optional(),
  status: z.preprocess(emptyToNull, productStatusSchema.nullable()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
