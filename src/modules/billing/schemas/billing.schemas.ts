import { z } from "zod";

export const subscribeSchema = z.object({
  planId: z.string().trim().min(1, "Selecione um plano"),
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
