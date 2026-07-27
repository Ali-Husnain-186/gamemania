import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  isTradeIn: z.boolean().optional(),
  tradePayoutMethod: z.enum(['CASH', 'STORE_CREDIT']).optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});

export const cartItemParamsSchema = z.object({
  id: z.string().cuid(),
});

export const mergeCartSchema = z.object({
  guestId: z.string().trim().min(1).max(100).optional(),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
