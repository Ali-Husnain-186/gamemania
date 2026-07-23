import type { Coupon } from '@prisma/client';
import { prisma } from '../config/prisma';
import { NotFoundError, ValidationError } from '../exceptions/AppError';

export type CouponValidationResult = {
  couponId: string;
  code: string;
  discountPence: number;
  freeShipping: boolean;
};

function assertCouponActive(coupon: Coupon, subtotalPence: number): void {
  if (!coupon.isActive) {
    throw new ValidationError('Coupon is not active');
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new ValidationError('Coupon is not yet valid');
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    throw new ValidationError('Coupon has expired');
  }
  if (coupon.minOrderAmount != null && subtotalPence < coupon.minOrderAmount) {
    throw new ValidationError(
      `Minimum order amount is £${(coupon.minOrderAmount / 100).toFixed(2)}`,
    );
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    throw new ValidationError('Coupon usage limit reached');
  }
}

export function computeCouponDiscount(
  coupon: Coupon,
  subtotalPence: number,
): { discountPence: number; freeShipping: boolean } {
  switch (coupon.type) {
    case 'FREE_SHIPPING':
      return { discountPence: 0, freeShipping: true };
    case 'FIXED_AMOUNT':
      return {
        discountPence: Math.min(coupon.value, subtotalPence),
        freeShipping: false,
      };
    case 'PERCENTAGE': {
      let discountPence = Math.floor((subtotalPence * coupon.value) / 100);
      if (coupon.maxDiscount != null) {
        discountPence = Math.min(discountPence, coupon.maxDiscount);
      }
      return { discountPence: Math.min(discountPence, subtotalPence), freeShipping: false };
    }
    default:
      return { discountPence: 0, freeShipping: false };
  }
}

export async function validateCoupon(
  code: string,
  subtotalPence: number,
  userId?: string,
): Promise<CouponValidationResult> {
  const coupon = await prisma.coupon.findFirst({
    where: { code: { equals: code.trim(), mode: 'insensitive' } },
  });
  if (!coupon) {
    throw new NotFoundError('Coupon not found');
  }

  assertCouponActive(coupon, subtotalPence);

  if (userId && coupon.perUserLimit > 0) {
    const userRedemptions = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId },
    });
    if (userRedemptions >= coupon.perUserLimit) {
      throw new ValidationError('Coupon already used');
    }
  }

  const { discountPence, freeShipping } = computeCouponDiscount(coupon, subtotalPence);

  return {
    couponId: coupon.id,
    code: coupon.code,
    discountPence,
    freeShipping,
  };
}
