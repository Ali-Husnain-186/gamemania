import { z } from 'zod';

export const tradeQuoteSchema = z.object({
  modelOptionId: z.string().cuid(),
  accessoryIds: z.array(z.string().cuid()).optional(),
});

const bankFields = {
  bankAccountName: z.string().trim().min(2).max(120).optional(),
  bankSortCode: z.string().trim().min(6).max(12).optional(),
  bankAccountNumber: z.string().trim().min(6).max(20).optional(),
};

export const createTradeRequestSchema = z
  .object({
    modelOptionId: z.string().cuid().optional(),
    payoutMethod: z.enum(['CASH', 'STORE_CREDIT']),
    accessories: z.array(z.string().cuid()).optional(),
    customerNotes: z.string().max(2000).optional(),
    isManual: z.boolean().optional(),
    manualCategory: z.string().trim().max(80).optional(),
    manualDescription: z.string().trim().max(4000).optional(),
    ...bankFields,
  })
  .superRefine((v, ctx) => {
    if (v.isManual) {
      if (!v.manualCategory?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Category is required for not-listed items',
          path: ['manualCategory'],
        });
      }
      if (!v.manualDescription?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Description is required for not-listed items',
          path: ['manualDescription'],
        });
      }
    } else if (!v.modelOptionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a console option or use Not listed',
        path: ['modelOptionId'],
      });
    }

    if (v.payoutMethod === 'CASH') {
      if (!v.bankAccountName?.trim() || !v.bankSortCode?.trim() || !v.bankAccountNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Bank details are required for cash payouts',
          path: ['bankAccountName'],
        });
      }
    }
  });

export const tradeRequestIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const adminUpdateTradeRequestSchema = z.object({
  status: z
    .enum([
      'QUOTED',
      'SUBMITTED',
      'RECEIVED',
      'GRADED',
      'APPROVED',
      'ADJUSTED',
      'REJECTED',
      'PAID',
      'CANCELLED',
    ])
    .optional(),
  finalCashPence: z.number().int().min(0).optional(),
  finalCreditPence: z.number().int().min(0).optional(),
  finalAmount: z.number().int().min(0).optional(),
  adminNotes: z.string().max(2000).optional(),
  gradedCondition: z
    .enum(['NEW', 'PRE_OWNED_EXCELLENT', 'PRE_OWNED_GOOD', 'PRE_OWNED_FAIR'])
    .optional(),
});

export type TradeQuoteInput = z.infer<typeof tradeQuoteSchema>;
export type CreateTradeRequestInput = z.infer<typeof createTradeRequestSchema>;
export type AdminUpdateTradeRequestInput = z.infer<typeof adminUpdateTradeRequestSchema>;
