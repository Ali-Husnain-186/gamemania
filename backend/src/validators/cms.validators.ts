import { z } from 'zod';

export const cmsSlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const blogSlugParamsSchema = z.object({
  slug: z.string().min(1),
});

const cmsPageBodySchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  content: z.string().min(1),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const createCmsPageSchema = cmsPageBodySchema;
export const updateCmsPageSchema = cmsPageBodySchema.partial();

export const createBlogPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const updateBlogPostSchema = createBlogPostSchema.partial();

export const cmsIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export type CreateCmsPageInput = z.infer<typeof createCmsPageSchema>;
export type UpdateCmsPageInput = z.infer<typeof updateCmsPageSchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
