import { z } from 'zod';

export const validateCouponSchema = z.object({
  code: z.string().min(1).max(50),
  subtotalPence: z.number().int().min(0),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
