import { prisma } from '../config/prisma';
import { NotFoundError } from '../exceptions/AppError';

export type AddressInput = {
  label?: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
};

function mapAddress(a: {
  id: string;
  label: string | null;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: a.id,
    label: a.label,
    fullName: a.fullName,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    county: a.county,
    postcode: a.postcode,
    country: a.country,
    phone: a.phone,
    isDefault: a.isDefault,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

async function unsetDefaultAddresses(userId: string, excludeId?: string) {
  await prisma.address.updateMany({
    where: { userId, isDefault: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
    data: { isDefault: false },
  });
}

export async function listAddresses(userId: string) {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return addresses.map(mapAddress);
}

export async function createAddress(userId: string, input: AddressInput) {
  if (input.isDefault) {
    await unsetDefaultAddresses(userId);
  }

  const address = await prisma.address.create({
    data: {
      userId,
      label: input.label,
      fullName: input.fullName,
      line1: input.line1,
      line2: input.line2,
      city: input.city,
      county: input.county,
      postcode: input.postcode,
      country: input.country ?? 'GB',
      phone: input.phone,
      isDefault: input.isDefault ?? false,
    },
  });

  return mapAddress(address);
}

export async function updateAddress(userId: string, id: string, input: Partial<AddressInput>) {
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError('Address not found');

  if (input.isDefault) {
    await unsetDefaultAddresses(userId, id);
  }

  const address = await prisma.address.update({
    where: { id },
    data: {
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.line1 !== undefined ? { line1: input.line1 } : {}),
      ...(input.line2 !== undefined ? { line2: input.line2 } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.county !== undefined ? { county: input.county } : {}),
      ...(input.postcode !== undefined ? { postcode: input.postcode } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
    },
  });

  return mapAddress(address);
}

export async function deleteAddress(userId: string, id: string) {
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError('Address not found');

  await prisma.address.delete({ where: { id } });
  return { deleted: true };
}
