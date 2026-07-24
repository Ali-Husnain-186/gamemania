import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    firstName: z.string().max(60).optional().nullable(),
    lastName: z.string().max(60).optional().nullable(),
    phone: z.string().max(30).optional().nullable(),
  })
  .refine(
    (data) =>
      data.firstName !== undefined || data.lastName !== undefined || data.phone !== undefined,
    { message: 'At least one field is required' },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
