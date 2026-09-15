import type { CouponType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { NotFoundError, ValidationError } from '../exceptions/AppError';

export type AdminCouponInput = {
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
};

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new ValidationError('Invalid date');
  return d;
}

export async function adminListCoupons() {
  return prisma.coupon.findMany({
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function adminCreateCoupon(input: AdminCouponInput) {
  const code = normalizeCode(input.code);
  if (!code) throw new ValidationError('Coupon code is required');
  if (input.value < 0) throw new ValidationError('Value must be >= 0');
  if (input.type === 'PERCENTAGE' && input.value > 100) {
    throw new ValidationError('Percentage cannot exceed 100');
  }

  const existing = await prisma.coupon.findFirst({
    where: { code: { equals: code, mode: 'insensitive' } },
  });
  if (existing) throw new ValidationError('Coupon code already exists');

  return prisma.coupon.create({
    data: {
      code,
      type: input.type,
      value: input.value,
      minOrderAmount: input.minOrderAmount ?? null,
      maxDiscount: input.maxDiscount ?? null,
      usageLimit: input.usageLimit ?? null,
      perUserLimit: input.perUserLimit ?? 1,
      startsAt: parseDate(input.startsAt),
      endsAt: parseDate(input.endsAt),
      isActive: input.isActive ?? true,
    },
  });
}

export async function adminUpdateCoupon(id: string, input: Partial<AdminCouponInput>) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new NotFoundError('Coupon not found');

  const data: Prisma.CouponUpdateInput = {};

  if (input.code !== undefined) {
    const code = normalizeCode(input.code);
    if (!code) throw new ValidationError('Coupon code is required');
    const clash = await prisma.coupon.findFirst({
      where: { code: { equals: code, mode: 'insensitive' }, NOT: { id } },
    });
    if (clash) throw new ValidationError('Coupon code already exists');
    data.code = code;
  }
  if (input.type !== undefined) data.type = input.type;
  if (input.value !== undefined) {
    if (input.value < 0) throw new ValidationError('Value must be >= 0');
    const type = input.type ?? coupon.type;
    if (type === 'PERCENTAGE' && input.value > 100) {
      throw new ValidationError('Percentage cannot exceed 100');
    }
    data.value = input.value;
  }
  if (input.minOrderAmount !== undefined) data.minOrderAmount = input.minOrderAmount;
  if (input.maxDiscount !== undefined) data.maxDiscount = input.maxDiscount;
  if (input.usageLimit !== undefined) data.usageLimit = input.usageLimit;
  if (input.perUserLimit !== undefined) data.perUserLimit = input.perUserLimit;
  if (input.startsAt !== undefined) data.startsAt = parseDate(input.startsAt);
  if (input.endsAt !== undefined) data.endsAt = parseDate(input.endsAt);
  if (input.isActive !== undefined) data.isActive = input.isActive;

  return prisma.coupon.update({ where: { id }, data });
}

export async function adminDeleteCoupon(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw new NotFoundError('Coupon not found');
  // Soft-deactivate if ever redeemed; otherwise hard delete unused codes.
  if (coupon.usageCount > 0) {
    return prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });
  }
  await prisma.coupon.delete({ where: { id } });
  return { deleted: true, id };
}
