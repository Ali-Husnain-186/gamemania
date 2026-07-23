import { prisma } from '../config/prisma';
import { NotFoundError } from '../exceptions/AppError';

export async function listWishlist(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: {
      userId,
      product: { deletedAt: null, status: 'ACTIVE' },
    },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    createdAt: item.createdAt,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      imageUrl: item.product.images[0]?.url ?? null,
      status: item.product.status,
    },
  }));
}

export async function addWishlistItem(userId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null, status: 'ACTIVE' },
  });
  if (!product) throw new NotFoundError('Product not found');

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });

  return listWishlist(userId);
}

export async function removeWishlistItem(userId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  return listWishlist(userId);
}
