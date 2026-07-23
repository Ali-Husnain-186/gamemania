import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  fullName: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  county: z.string().max(100).optional(),
  postcode: z.string().min(1).max(20),
  country: z.string().length(2).default('GB'),
  phone: z.string().max(30).optional(),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

export const addressIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
