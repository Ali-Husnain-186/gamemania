import type { ReviewStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ConflictError, NotFoundError } from '../exceptions/AppError';
import type { AdminUpdateReviewInput } from '../validators/review.validators';

export async function listProductReviews(productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!product) throw new NotFoundError('Product not found');

  return prisma.review.findMany({
    where: { productId, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/** Approved reviews for homepage / marketing surfaces */
export async function listFeaturedReviews(limit = 8) {
  return prisma.review.findMany({
    where: { status: 'APPROVED', body: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function createReview(
  userId: string,
  input: { productId: string; rating: number; title?: string; body?: string },
) {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, deletedAt: null, status: 'ACTIVE' },
  });
  if (!product) throw new NotFoundError('Product not found');

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId: input.productId, userId } },
  });
  if (existing) throw new ConflictError('You have already reviewed this product');

  return prisma.review.create({
    data: {
      productId: input.productId,
      userId,
      rating: input.rating,
      title: input.title,
      body: input.body,
      status: 'PENDING',
    },
  });
}

export async function adminListReviews() {
  return prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function adminUpdateReview(id: string, input: AdminUpdateReviewInput) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new NotFoundError('Review not found');

  return prisma.review.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status as ReviewStatus } : {}),
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function adminDeleteReview(id: string) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new NotFoundError('Review not found');
  await prisma.review.delete({ where: { id } });
  return { deleted: true };
}
