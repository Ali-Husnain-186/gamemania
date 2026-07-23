import { z } from 'zod';

export const addWishlistSchema = z.object({
  productId: z.string().min(1),
});

export type AddWishlistInput = z.infer<typeof addWishlistSchema>;
