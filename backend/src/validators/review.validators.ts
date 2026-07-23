import { z } from 'zod';

export const listReviewsQuerySchema = z.object({
  productId: z.string().cuid(),
});

export const createReviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(5000).optional(),
});

export const adminUpdateReviewSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

export const reviewIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
