import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length === 0 ? null : text;
};

export const teamRoleSchema = z.enum([
  "ADMIN",
  "MANAGER",
  "SALES",
  "FINANCE",
  "INVENTORY",
]);

export const memberStatusFilterSchema = z.enum(["active", "inactive"]);

export const teamListQuerySchema = z.object({
  q: z.preprocess(emptyToNull, z.string().max(120).nullable()).optional(),
  role: z.preprocess(emptyToNull, teamRoleSchema.nullable()).optional(),
  status: z.preprocess(emptyToNull, memberStatusFilterSchema.nullable()).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const changeMemberRoleSchema = z.object({
  membershipId: z.string().cuid("Membro inválido"),
  role: teamRoleSchema,
});

export const memberIdSchema = z.object({
  membershipId: z.string().cuid("Membro inválido"),
});

export const inviteIdSchema = z.object({
  inviteId: z.string().cuid("Convite inválido"),
});

export type TeamListQuery = z.infer<typeof teamListQuerySchema>;
export type ChangeMemberRoleInput = z.infer<typeof changeMemberRoleSchema>;
