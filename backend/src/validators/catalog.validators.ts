import { z } from 'zod';
import { paginationSchema } from './common';

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
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().trim().min(2).max(64),
  description: z.string().max(20000).optional(),
  shortDescription: z.string().max(500).optional(),
  price: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  platform: z.string().max(64).optional().nullable(),
  condition: z
    .enum(['NEW', 'PRE_OWNED_EXCELLENT', 'PRE_OWNED_GOOD', 'PRE_OWNED_FAIR'])
    .default('NEW'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK']).default('DRAFT'),
  isFeatured: z.boolean().optional(),
  quantity: z.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
