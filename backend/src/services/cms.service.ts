import type { CmsPageStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { NotFoundError } from '../exceptions/AppError';
import { slugify } from '../utils/slug';

export async function getPublishedPage(slug: string) {
  const page = await prisma.cmsPage.findFirst({
    where: { slug, status: 'PUBLISHED' },
  });
  if (!page) throw new NotFoundError('Page not found');
  return page;
}

export async function listPublishedBlogPosts() {
  return prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImageUrl: true,
      publishedAt: true,
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function getPublishedBlogPost(slug: string) {
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!post) throw new NotFoundError('Blog post not found');
  return post;
}

export async function adminListPages() {
  return prisma.cmsPage.findMany({ orderBy: { updatedAt: 'desc' } });
}

export async function adminCreatePage(input: {
  title: string;
  slug?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: CmsPageStatus;
}) {
  const slug = input.slug ?? slugify(input.title);
  return prisma.cmsPage.create({
    data: {
      title: input.title,
      slug,
      content: input.content,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      status: input.status ?? 'DRAFT',
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
    },
  });
}

export async function adminUpdatePage(
  id: string,
  input: Partial<{
    title: string;
    slug: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
    status: CmsPageStatus;
  }>,
) {
  const existing = await prisma.cmsPage.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Page not found');

  const status = input.status ?? existing.status;
  return prisma.cmsPage.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle } : {}),
      ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      publishedAt:
        status === 'PUBLISHED'
          ? (existing.publishedAt ?? new Date())
          : input.status === 'DRAFT'
            ? null
            : existing.publishedAt,
    },
  });
}

export async function adminDeletePage(id: string) {
  const existing = await prisma.cmsPage.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Page not found');
  await prisma.cmsPage.delete({ where: { id } });
  return { deleted: true };
}

export async function adminListBlogPosts() {
  return prisma.blogPost.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { author: { select: { id: true, firstName: true, lastName: true } } },
  });
}

export async function adminCreateBlogPost(
  authorId: string,
  input: {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    coverImageUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: CmsPageStatus;
  },
) {
  const slug = input.slug ?? slugify(input.title);
  return prisma.blogPost.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      coverImageUrl: input.coverImageUrl,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      status: input.status ?? 'DRAFT',
      authorId,
      publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
    },
  });
}

export async function adminUpdateBlogPost(
  id: string,
  input: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    metaTitle: string;
    metaDescription: string;
    status: CmsPageStatus;
  }>,
) {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Blog post not found');

  const status = input.status ?? existing.status;
  return prisma.blogPost.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl } : {}),
      ...(input.metaTitle !== undefined ? { metaTitle: input.metaTitle } : {}),
      ...(input.metaDescription !== undefined ? { metaDescription: input.metaDescription } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      publishedAt:
        status === 'PUBLISHED'
          ? (existing.publishedAt ?? new Date())
          : input.status === 'DRAFT'
            ? null
            : existing.publishedAt,
    },
  });
}

export async function adminDeleteBlogPost(id: string) {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Blog post not found');
  await prisma.blogPost.delete({ where: { id } });
  return { deleted: true };
}
