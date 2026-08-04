import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ConflictError, NotFoundError } from '../exceptions/AppError';
import { slugify } from '../utils/slug';
import type {
  CreateProductInput,
  ProductListQuery,
  UpdateProductInput,
} from '../validators/catalog.validators';
import { normalizeProductImages } from '../validators/catalog.validators';

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'product';
  let candidate = root;
  let n = 1;
  while (true) {
    const clash = await prisma.product.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${root}-${n++}`;
  }
}

async function uniqueSku(preferred?: string, excludeId?: string): Promise<string> {
  let candidate = preferred?.trim() || `GM-${Date.now().toString(36).toUpperCase()}`;
  let n = 1;
  while (true) {
    const clash = await prisma.product.findFirst({
      where: {
        sku: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${preferred?.trim() || 'GM'}-${n++}`;
  }
}

const productPublicInclude = {
  images: { orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }] },
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  inventory: { select: { quantity: true, reserved: true } },
} satisfies Prisma.ProductInclude;

type ProductImageRow = {
  id: string;
  url: string;
  publicId: string | null;
  altText: string | null;
  isPrimary: boolean;
  sortOrder?: number;
};

function brandPlaceholderUrl(platform: string | null, brandSlug?: string | null): string {
  const p = (platform ?? '').toUpperCase();
  const brand = (brandSlug ?? '').toLowerCase();
  if (p.includes('PS') || brand === 'sony') return '/brand/playstation.png';
  if (p.includes('SWITCH') || brand === 'nintendo') return '/brand/nintendo.png';
  if (p.includes('XBOX') || brand === 'microsoft') return '/brand/pcgames.png';
  if (brand === 'sony') return '/brand/playstation.png';
  return '/brand/pcgames.png';
}

function mapProduct(product: {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  shortDescription: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  price: number;
  compareAtPrice: number | null;
  platform: string | null;
  condition: string;
  status: string;
  isFeatured: boolean;
  isPreorder?: boolean;
  releaseDate?: Date | null;
  tradeInCashPence?: number | null;
  tradeInCreditPence?: number | null;
  images: ProductImageRow[];
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
    metaTitle: product.metaTitle ?? null,
    metaDescription: product.metaDescription ?? null,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    categoryId: product.category?.id ?? null,
    brandId: product.brand?.id ?? null,
    platform: product.platform,
    condition: product.condition,
    status: product.status,
    isFeatured: product.isFeatured,
    isPreorder: product.isPreorder ?? false,
    releaseDate: product.releaseDate ?? null,
    tradeInCashPence: product.tradeInCashPence ?? null,
    tradeInCreditPence: product.tradeInCreditPence ?? null,
    images: product.images,
    category: product.category,
    brand: product.brand,
    stock: Math.max(0, available),
  };
}

/** When a product has no gallery, clone a same-platform image or use brand art. */
async function mapProductsWithImageFallback(rows: Array<Parameters<typeof mapProduct>[0]>) {
  const missing = rows.filter((r) => !r.images?.length);
  const relatedByPlatform = new Map<string, ProductImageRow>();

  if (missing.length) {
    const platforms = [
      ...new Set(missing.map((m) => m.platform).filter((p): p is string => Boolean(p))),
    ];
    if (platforms.length) {
      const donors = await prisma.product.findMany({
        where: {
          deletedAt: null,
          platform: { in: platforms },
          images: { some: {} },
        },
        include: {
          images: {
            take: 1,
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
        },
        take: 80,
      });
      for (const d of donors) {
        if (d.platform && d.images[0] && !relatedByPlatform.has(d.platform)) {
          relatedByPlatform.set(d.platform, d.images[0]);
        }
      }
    }
  }

  return rows.map((row) => {
    const mapped = mapProduct(row);
    if (mapped.images?.length) return mapped;

    const related = row.platform ? relatedByPlatform.get(row.platform) : undefined;
    if (related) {
      mapped.images = [
        {
          id: related.id,
          url: related.url,
          publicId: related.publicId,
          altText: related.altText ?? row.name,
          isPrimary: true,
          sortOrder: 0,
        },
      ];
      return mapped;
    }

    mapped.images = [
      {
        id: `fallback-${row.id}`,
        url: brandPlaceholderUrl(row.platform, row.brand?.slug),
        publicId: null,
        altText: row.name,
        isPrimary: true,
        sortOrder: 0,
      },
    ];
    return mapped;
  });
}

export async function listProducts(query: ProductListQuery, admin = false) {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(admin ? {} : { status: 'ACTIVE' }),
  };

  if (query.q && query.category) {
    where.AND = [
      {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { sku: { contains: query.q, mode: 'insensitive' } },
          { shortDescription: { contains: query.q, mode: 'insensitive' } },
        ],
      },
      {
        OR: [
          { category: { slug: query.category } },
          { category: { parent: { slug: query.category } } },
        ],
      },
    ];
  } else if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { sku: { contains: query.q, mode: 'insensitive' } },
      { shortDescription: { contains: query.q, mode: 'insensitive' } },
    ];
  } else if (query.category) {
    where.OR = [
      { category: { slug: query.category } },
      { category: { parent: { slug: query.category } } },
    ];
  }
  if (query.brand) {
    where.brand = { slug: query.brand };
  }
  if (query.platform) {
    where.platform = query.platform;
  }
  if (query.condition) {
    where.condition = query.condition;
  } else if (!admin) {
    // Storefront: show New (+ used-only singles). Hide -used twins; PDP picker links to them.
    const hideUsedTwin = { NOT: { slug: { endsWith: '-used' } } };
    if (where.AND) {
      where.AND = Array.isArray(where.AND)
        ? [...where.AND, hideUsedTwin]
        : [where.AND, hideUsedTwin];
    } else {
      where.AND = [hideUsedTwin];
    }
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }
  if (query.preorder === true) {
    where.isPreorder = true;
  } else if (query.preorder === false) {
    where.isPreorder = false;
  }
  if (query.inStock === true) {
    where.inventory = { is: { quantity: { gt: 0 } } };
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
            : query.sort === 'release'
              ? { releaseDate: 'asc' }
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
    items: await mapProductsWithImageFallback(rows),
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
  const [mapped] = await mapProductsWithImageFallback([product]);
  return mapped;
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
  const slug = await uniqueSlug(input.slug || input.name);
  const sku = await uniqueSku(input.sku);
  const images = normalizeProductImages(input.images, {
    imageUrl: input.imageUrl,
    imagePublicId: input.imagePublicId,
    altText: input.name,
  });

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      sku,
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
      isPreorder: input.isPreorder ?? false,
      releaseDate: input.releaseDate ?? undefined,
      tradeInCashPence: input.tradeInCashPence ?? undefined,
      tradeInCreditPence: input.tradeInCreditPence ?? undefined,
      inventory: { create: { quantity: input.quantity ?? 0, reserved: 0 } },
      ...(images.length
        ? {
            images: {
              create: images.map((img) => ({
                url: img.url,
                publicId: img.publicId,
                altText: img.altText ?? input.name,
                isPrimary: img.isPrimary,
                sortOrder: img.sortOrder,
              })),
            },
          }
        : {}),
    },
    include: productPublicInclude,
  });

  return mapProduct(product);
}

export async function deleteProduct(id: string) {
  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError('Product not found');

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'ARCHIVED', isFeatured: false },
  });

  return { deleted: true, id };
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError('Product not found');

  if (input.slug) {
    const clash = await prisma.product.findFirst({
      where: { slug: input.slug, NOT: { id } },
      select: { id: true },
    });
    if (clash) throw new ConflictError('Product slug already exists');
  }
  if (input.sku) {
    const clash = await prisma.product.findFirst({
      where: { sku: input.sku, NOT: { id } },
      select: { id: true },
    });
    if (clash) throw new ConflictError('Product SKU already exists');
  }

  if (input.images !== undefined || input.imageUrl) {
    const images = normalizeProductImages(input.images, {
      imageUrl: input.imageUrl,
      imagePublicId: input.imagePublicId,
      altText: input.name ?? existing.name,
    });
    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((img) => ({
            productId: id,
            url: img.url,
            publicId: img.publicId,
            altText: img.altText ?? input.name ?? existing.name,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
          })),
        });
      }
    });
  }

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
      isPreorder: input.isPreorder,
      releaseDate: input.releaseDate === null ? null : input.releaseDate,
      tradeInCashPence: input.tradeInCashPence === null ? null : input.tradeInCashPence,
      tradeInCreditPence: input.tradeInCreditPence === null ? null : input.tradeInCreditPence,
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

export async function adminListCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      parentId: true,
      sortOrder: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  parentId?: string | null;
}) {
  const slug = await uniqueCategorySlug(input.slug || input.name);
  return prisma.category.create({
    data: {
      name: input.name.trim(),
      slug,
      description: input.description ?? undefined,
      imageUrl: input.imageUrl ?? undefined,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
      parentId: input.parentId ?? undefined,
    },
  });
}

export async function updateCategory(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string | null;
    imageUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    parentId?: string | null;
  },
) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Category not found');

  if (input.slug) {
    const clash = await prisma.category.findFirst({
      where: { slug: input.slug, NOT: { id } },
      select: { id: true },
    });
    if (clash) throw new ConflictError('Category slug already exists');
  }

  return prisma.category.update({
    where: { id },
    data: {
      name: input.name?.trim(),
      slug: input.slug,
      description: input.description === null ? null : input.description,
      imageUrl: input.imageUrl === null ? null : input.imageUrl,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      parentId: input.parentId === null ? null : input.parentId,
    },
  });
}

export async function deleteCategory(id: string) {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!existing) throw new NotFoundError('Category not found');
  if (existing._count.products > 0) {
    throw new ConflictError('Category has products — reassign or deactivate instead');
  }
  if (existing._count.children > 0) {
    throw new ConflictError('Category has child categories — remove children first');
  }
  await prisma.category.delete({ where: { id } });
  return { deleted: true, id };
}

export async function adminListBrands() {
  return prisma.brand.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });
}

export async function createBrand(input: {
  name: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive?: boolean;
}) {
  const slug = await uniqueBrandSlug(input.slug || input.name);
  return prisma.brand.create({
    data: {
      name: input.name.trim(),
      slug,
      description: input.description ?? undefined,
      logoUrl: input.logoUrl ?? undefined,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateBrand(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string | null;
    logoUrl?: string | null;
    isActive?: boolean;
  },
) {
  const existing = await prisma.brand.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Brand not found');

  if (input.slug) {
    const clash = await prisma.brand.findFirst({
      where: { slug: input.slug, NOT: { id } },
      select: { id: true },
    });
    if (clash) throw new ConflictError('Brand slug already exists');
  }
  if (input.name) {
    const clash = await prisma.brand.findFirst({
      where: { name: input.name.trim(), NOT: { id } },
      select: { id: true },
    });
    if (clash) throw new ConflictError('Brand name already exists');
  }

  return prisma.brand.update({
    where: { id },
    data: {
      name: input.name?.trim(),
      slug: input.slug,
      description: input.description === null ? null : input.description,
      logoUrl: input.logoUrl === null ? null : input.logoUrl,
      isActive: input.isActive,
    },
  });
}

export async function deleteBrand(id: string) {
  const existing = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!existing) throw new NotFoundError('Brand not found');
  if (existing._count.products > 0) {
    throw new ConflictError('Brand has products — reassign or deactivate instead');
  }
  await prisma.brand.delete({ where: { id } });
  return { deleted: true, id };
}

async function uniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'category';
  let candidate = root;
  let n = 1;
  while (true) {
    const clash = await prisma.category.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${root}-${n++}`;
  }
}

async function uniqueBrandSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'brand';
  let candidate = root;
  let n = 1;
  while (true) {
    const clash = await prisma.brand.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!clash) return candidate;
    candidate = `${root}-${n++}`;
  }
}
