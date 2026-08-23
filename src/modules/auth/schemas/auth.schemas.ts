import { z } from "zod";
import type { Role } from "@prisma/client";

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .max(128);

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(120),
  email: z.string().email("E-mail inválido"),
  password: passwordSchema,
  companyName: z.string().min(2, "Nome da empresa muito curto").max(120),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

export const inviteMemberSchema = z.object({
  email: z.string().email("E-mail inválido"),
  role: z.enum([
    "ADMIN",
    "MANAGER",
    "SALES",
    "FINANCE",
    "INVENTORY",
  ] as const satisfies readonly Role[]),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  name: z.string().min(2).max(120),
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
