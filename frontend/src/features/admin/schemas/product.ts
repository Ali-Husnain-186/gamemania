import { z } from 'zod';

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
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export function poundsToPence(value: string): number {
  return Math.round(Number(value) * 100);
}

export function penceToPoundsInput(pence: number): string {
  return (pence / 100).toFixed(2);
}
