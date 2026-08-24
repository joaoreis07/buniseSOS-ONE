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

const positiveInt = (label: string) =>
  z.coerce
    .number()
    .int(`${label} deve ser inteiro`)
    .positive(`${label} deve ser maior que zero`);

const nonNegativeInt = (label: string) =>
  z.coerce
    .number()
    .int(`${label} deve ser inteiro`)
    .min(0, `${label} não pode ser negativo`);

export const inventoryMovementTypeSchema = z.enum([
  "ENTRY",
  "EXIT",
  "ADJUSTMENT",
  "RETURN",
  "LOSS",
]);

export const inventoryListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  categoryId: z.preprocess(emptyToNull, z.string().cuid().nullable()).optional(),
  status: z.preprocess(emptyToNull, z.enum(["ACTIVE", "INACTIVE"]).nullable()).optional(),
  stock: z
    .preprocess(emptyToNull, z.enum(["low", "out"]).nullable())
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const minimumQuantitySchema = z.object({
  minimumQuantity: nonNegativeInt("Estoque mínimo"),
});

export const movementFormSchema = z
  .object({
    type: inventoryMovementTypeSchema,
    quantity: positiveInt("Quantidade"),
    targetQuantity: z.preprocess(emptyToNull, z.string().nullable()).optional(),
    reason: optionalText(160, "Motivo"),
    notes: optionalText(2000, "Observações"),
  })
  .superRefine((data, ctx) => {
    if (data.type === "ADJUSTMENT") {
      const target = data.targetQuantity
        ? Number(data.targetQuantity)
        : Number.NaN;
      if (!Number.isInteger(target) || target < 0) {
        ctx.addIssue({
          code: "custom",
          message: "Informe a quantidade final desejada (≥ 0)",
          path: ["targetQuantity"],
        });
      }
    }
  });

export type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>;
export type MinimumQuantityInput = z.infer<typeof minimumQuantitySchema>;
export type MovementFormInput = z.infer<typeof movementFormSchema>;
