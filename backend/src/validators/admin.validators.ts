import { z } from 'zod';
import { paginationSchema } from './common';

export const adminOrdersQuerySchema = paginationSchema.extend({
  status: z
    .enum([
      'PENDING',
      'AWAITING_PAYMENT',
      'PAID',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
      'PARTIALLY_REFUNDED',
    ])
    .optional(),
});

export const adminCustomersQuerySchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
});

export const adminUpdateOrderSchema = z.object({
  status: z.enum([
    'PENDING',
    'AWAITING_PAYMENT',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
  ]),
});

export const orderIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const shippingRulesPatchSchema = z.object({
  rules: z
    .array(
      z.object({
        id: z.string().cuid().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        minOrderAmount: z.number().int().min(0),
        maxOrderAmount: z.number().int().min(0).nullable().optional(),
        rate: z.number().int().min(0),
        country: z.string().length(2).optional(),
        isActive: z.boolean().optional(),
        priority: z.number().int().optional(),
      }),
    )
    .min(1),
});

export const settingKeyParamsSchema = z.object({
  key: z.string().min(1),
});

export const updateSettingSchema = z.object({
  value: z.unknown(),
  group: z.string().optional(),
});

export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;
export type AdminCustomersQuery = z.infer<typeof adminCustomersQuerySchema>;
export type ShippingRulesPatchInput = z.infer<typeof shippingRulesPatchSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
