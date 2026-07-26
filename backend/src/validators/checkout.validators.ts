import { z } from 'zod';

const checkoutOptionsSchema = z.object({
  couponCode: z.string().min(1).max(50).optional(),
  useStoreCredit: z.boolean().optional(),
  pointsToRedeem: z.number().int().min(0).optional(),
  country: z.string().length(2).optional(),
});

const shippingAddressFieldsSchema = z.object({
  fullName: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  county: z.string().max(100).optional(),
  postcode: z.string().min(1).max(20),
  country: z.string().length(2).optional(),
  phone: z.string().max(30).optional(),
});

export const checkoutPreviewSchema = checkoutOptionsSchema;

export const checkoutSchema = checkoutOptionsSchema
  .extend({
    shippingAddressId: z.string().cuid().optional(),
    billingAddressId: z.string().cuid().optional(),
    shipping: shippingAddressFieldsSchema.optional(),
    notes: z.string().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.shippingAddressId && !value.shipping) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Delivery address is required',
        path: ['shipping'],
      });
    }
  });

export type CheckoutPreviewInput = z.infer<typeof checkoutPreviewSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutShippingInput = z.infer<typeof shippingAddressFieldsSchema>;

export const orderNumberParamsSchema = z.object({
  orderNumber: z.string().min(1),
});
