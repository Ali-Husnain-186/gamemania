import { z } from 'zod';

export const listReviewsQuerySchema = z.object({
  productId: z.string().cuid(),
});

export const featuredReviewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export const createReviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(5000).optional(),
});

export const adminUpdateReviewSchema = z
  .object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().max(120).optional().nullable(),
    body: z.string().max(5000).optional().nullable(),
  })
  .refine(
    (v) =>
      v.status !== undefined ||
      v.rating !== undefined ||
      v.title !== undefined ||
      v.body !== undefined,
    { message: 'Provide at least one field to update' },
  );

export const reviewIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type FeaturedReviewsQuery = z.infer<typeof featuredReviewsQuerySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type AdminUpdateReviewInput = z.infer<typeof adminUpdateReviewSchema>;
