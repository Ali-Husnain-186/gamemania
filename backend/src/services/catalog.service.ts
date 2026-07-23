import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ConflictError, NotFoundError } from '../exceptions/AppError';
import type {
  CreateProductInput,
  ProductListQuery,
  UpdateProductInput,
} from '../validators/catalog.validators';

const productPublicInclude = {
  images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }] },
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  inventory: { select: { quantity: true, reserved: true } },
} satisfies Prisma.ProductInclude;

function mapProduct(product: {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  platform: string | null;
  condition: string;
  status: string;
  isFeatured: boolean;
  images: Array<{ id: string; url: string; altText: string | null; isPrimary: boolean }>;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
  inventory: { quantity: number; reserved: number } | null;
}) {
  const available = (product.inventory?.quantity ?? 0) - (product.inventory?.reserved ?? 0);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    categoryId: product.category?.id ?? null,
    brandId: product.brand?.id ?? null,
    platform: product.platform,
    condition: product.condition,
    status: product.status,
    isFeatured: product.isFeatured,
    images: product.images,
    category: product.category,
    brand: product.brand,
    stock: Math.max(0, available),
  };
}

export async function listProducts(query: ProductListQuery, admin = false) {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(admin ? {} : { status: 'ACTIVE' }),
  };

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { sku: { contains: query.q, mode: 'insensitive' } },
      { shortDescription: { contains: query.q, mode: 'insensitive' } },
    ];
  }
  if (query.category) {
    where.category = { slug: query.category };
  }
  if (query.brand) {
    where.brand = { slug: query.brand };
  }
  if (query.platform) {
    where.platform = query.platform;
  }
  if (query.condition) {
    where.condition = query.condition;
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    query.sort === 'price_asc'
      ? { price: 'asc' }
      : query.sort === 'price_desc'
        ? { price: 'desc' }
        : query.sort === 'name_asc'
          ? { name: 'asc' }
          : query.sort === 'featured'
            ? { isFeatured: 'desc' }
            : { createdAt: 'desc' };

  const skip = (query.page - 1) * query.limit;
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productPublicInclude,
      orderBy,
      skip,
      take: query.limit,
    }),
  ]);

  return {
    items: rows.map(mapProduct),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 0,
    },
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null, status: 'ACTIVE' },
    include: productPublicInclude,
  });
  if (!product) throw new NotFoundError('Product not found');
  return mapProduct(product);
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      parentId: true,
      sortOrder: true,
    },
  });
}

export async function listBrands() {
  return prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
    },
  });
}

export async function createProduct(input: CreateProductInput) {
  const exists = await prisma.product.findFirst({
    where: { OR: [{ slug: input.slug }, { sku: input.sku }] },
  });
  if (exists) throw new ConflictError('Product slug or SKU already exists');

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug: input.slug,
      sku: input.sku,
      description: input.description,
      shortDescription: input.shortDescription,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? undefined,
      categoryId: input.categoryId ?? undefined,
      brandId: input.brandId ?? undefined,
      platform: input.platform ?? undefined,
      condition: input.condition,
      status: input.status,
      isFeatured: input.isFeatured ?? false,
      inventory: { create: { quantity: input.quantity, reserved: 0 } },
      ...(input.imageUrl
        ? {
            images: {
              create: {
                url: input.imageUrl,
                altText: input.name,
                isPrimary: true,
              },
            },
          }
        : {}),
    },
    include: productPublicInclude,
  });

  return mapProduct(product);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError('Product not found');

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      sku: input.sku,
      description: input.description,
      shortDescription: input.shortDescription,
      price: input.price,
      compareAtPrice: input.compareAtPrice === null ? null : input.compareAtPrice,
      categoryId: input.categoryId === null ? null : input.categoryId,
      brandId: input.brandId === null ? null : input.brandId,
      platform: input.platform === null ? null : input.platform,
      condition: input.condition,
      status: input.status,
      isFeatured: input.isFeatured,
      ...(input.quantity !== undefined
        ? {
            inventory: {
              upsert: {
                create: { quantity: input.quantity, reserved: 0 },
                update: { quantity: input.quantity },
              },
            },
          }
        : {}),
    },
    include: productPublicInclude,
  });

  return mapProduct(product);
}
