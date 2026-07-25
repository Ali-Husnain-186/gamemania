import { z } from 'zod';
import { paginationSchema } from './common';

function emptyToUndefined(val: unknown) {
  if (val === '' || val === null) return undefined;
  return val;
}

export const productListQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    category: z.string().trim().optional(),
    brand: z.string().trim().optional(),
    platform: z.string().trim().optional(),
    condition: z
      .enum(['NEW', 'PRE_OWNED_EXCELLENT', 'PRE_OWNED_GOOD', 'PRE_OWNED_FAIR'])
      .optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc', 'name_asc', 'featured']).default('newest'),
  })
  .merge(paginationSchema);

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters'),
  slug: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(2, 'Slug must be at least 2 characters')
      .max(220, 'Slug must be at most 220 characters')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must be lowercase letters, numbers and hyphens only',
      )
      .optional(),
  ),
  sku: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(2, 'SKU must be at least 2 characters')
      .max(64, 'SKU must be at most 64 characters')
      .optional(),
  ),
  description: z.preprocess(
    emptyToUndefined,
    z.string().max(20000, 'Description must be at most 20,000 characters').optional(),
  ),
  shortDescription: z.preprocess(
    emptyToUndefined,
    z.string().max(500, 'Short description must be at most 500 characters').optional(),
  ),
  price: z
    .number({
      required_error: 'Price is required',
      invalid_type_error: 'Price must be a number (in pence)',
    })
    .int('Price must be a whole number of pence')
    .min(0, 'Price cannot be negative'),
  compareAtPrice: z.number().int().min(0).optional().nullable(),
  categoryId: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  brandId: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  platform: z.preprocess(
    emptyToUndefined,
    z.string().max(64, 'Platform must be at most 64 characters').optional().nullable(),
  ),
  condition: z
    .enum(['NEW', 'PRE_OWNED_EXCELLENT', 'PRE_OWNED_GOOD', 'PRE_OWNED_FAIR'])
    .default('NEW'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK']).default('DRAFT'),
  isFeatured: z.boolean().optional(),
  quantity: z
    .number({ invalid_type_error: 'Stock quantity must be a number' })
    .int('Stock quantity must be a whole number')
    .min(0, 'Stock quantity cannot be negative')
    .default(0),
  imageUrl: z.preprocess(
    emptyToUndefined,
    z.string().url('Image URL must be a valid URL').optional(),
  ),
  imagePublicId: z.preprocess(emptyToUndefined, z.string().optional()),
});

export const updateProductSchema = createProductSchema.partial();

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
