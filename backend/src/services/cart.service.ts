import { prisma } from '../config/prisma';
import { NotFoundError, ValidationError } from '../exceptions/AppError';

async function resolveCart(userId?: string, guestId?: string) {
  if (userId) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
  if (!guestId) {
    throw new ValidationError('X-Guest-Id header required for guest carts');
  }
  return prisma.cart.upsert({
    where: { guestId },
    update: {},
    create: { guestId },
  });
}

async function loadCart(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
                take: 1,
              },
              inventory: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!cart) throw new NotFoundError('Cart not found');

  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      imageUrl: item.product.images[0]?.url ?? null,
      stock: Math.max(
        0,
        (item.product.inventory?.quantity ?? 0) - (item.product.inventory?.reserved ?? 0),
      ),
    },
    lineTotal: item.product.price * item.quantity,
  }));

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return { id: cart.id, items, subtotalPence: subtotal, itemCount };
}

export async function getCart(userId?: string, guestId?: string) {
  const cart = await resolveCart(userId, guestId);
  return loadCart(cart.id);
}

export async function addCartItem(
  productId: string,
  quantity: number,
  userId?: string,
  guestId?: string,
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null, status: 'ACTIVE' },
  });
  if (!product) throw new NotFoundError('Product not found');

  const cart = await resolveCart(userId, guestId);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }

  return loadCart(cart.id);
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
  userId?: string,
  guestId?: string,
) {
  const cart = await resolveCart(userId, guestId);
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw new NotFoundError('Cart item not found');

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return loadCart(cart.id);
}

export async function removeCartItem(itemId: string, userId?: string, guestId?: string) {
  const cart = await resolveCart(userId, guestId);
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw new NotFoundError('Cart item not found');

  await prisma.cartItem.delete({ where: { id: itemId } });
  return loadCart(cart.id);
}

export async function mergeGuestCart(userId: string, guestId?: string) {
  if (!guestId) return getCart(userId);

  const guestCart = await prisma.cart.findUnique({
    where: { guestId },
    include: { items: true },
  });
  if (!guestCart || guestCart.items.length === 0) return getCart(userId);

  const userCart = await resolveCart(userId);

  for (const item of guestCart.items) {
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
    });
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: item.productId,
          quantity: item.quantity,
        },
      });
    }
  }

  await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
  await prisma.cart.delete({ where: { id: guestCart.id } });

  return loadCart(userCart.id);
}
