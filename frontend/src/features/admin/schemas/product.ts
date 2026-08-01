import { z } from 'zod';

export const productImageSlotSchema = z.object({
  url: z.union([z.literal(''), z.string().url()]),
  publicId: z.string().optional(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(3).optional(),
});

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name is required (at least 2 characters)')
    .max(200, 'Name must be at most 200 characters'),
  pricePounds: z
    .string()
    .trim()
    .min(1, 'Price is required')
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), 'Enter a valid price like 49.99')
    .refine((v) => Number(v) >= 0, 'Price cannot be negative'),
  quantity: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), 'Stock quantity must be a whole number (0 or more)'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK']),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  shortDescription: z
    .string()
    .max(500, 'Short description must be at most 500 characters')
    .optional(),
  images: z.array(productImageSlotSchema).max(4, 'Maximum 4 product images').optional(),
  isFeatured: z.boolean().optional(),
  isPreorder: z.boolean().optional(),
  releaseDate: z.string().optional(),
  tradeInCashPounds: z
    .string()
    .trim()
    .min(1, 'Cash trade-in price is required')
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), 'Enter a valid amount like 6.00'),
  tradeInCreditPounds: z
    .string()
    .trim()
    .min(1, 'Store credit trade-in price is required')
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), 'Enter a valid amount like 8.00'),
  platform: z.string().optional(),
  condition: z.enum(['NEW', 'PRE_OWNED_EXCELLENT', 'PRE_OWNED_GOOD', 'PRE_OWNED_FAIR']),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductImageSlot = z.infer<typeof productImageSlotSchema>;

export const emptyImageSlots = (): ProductImageSlot[] =>
  Array.from({ length: 4 }, () => ({ url: '', publicId: '', isPrimary: false }));

export function poundsToPence(value: string): number {
  return Math.round(Number(value) * 100);
}

export function penceToPoundsInput(pence: number): string {
  return (pence / 100).toFixed(2);
}
