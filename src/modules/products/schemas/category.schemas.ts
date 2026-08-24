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

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  description: optionalText(2000, "Descrição"),
});

export const categoryListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>;
