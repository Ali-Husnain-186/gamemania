import { z } from 'zod';

const checkoutOptionsSchema = z.object({
  couponCode: z.string().min(1).max(50).optional(),
  useStoreCredit: z.boolean().optional(),
  pointsToRedeem: z.number().int().min(0).optional(),
  country: z.string().length(2).optional(),
});

export const checkoutPreviewSchema = checkoutOptionsSchema;

export const checkoutSchema = checkoutOptionsSchema.extend({
  shippingAddressId: z.string().cuid(),
  billingAddressId: z.string().cuid().optional(),
  notes: z.string().max(1000).optional(),
});

export type CheckoutPreviewInput = z.infer<typeof checkoutPreviewSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const orderNumberParamsSchema = z.object({
  orderNumber: z.string().min(1),
});
