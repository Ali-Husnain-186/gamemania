import { z } from 'zod';

export const tradeQuoteSchema = z.object({
  modelOptionId: z.string().cuid(),
  accessoryIds: z.array(z.string().cuid()).optional(),
});

export const createTradeRequestSchema = z.object({
  modelOptionId: z.string().cuid(),
  payoutMethod: z.enum(['CASH', 'STORE_CREDIT']),
  accessories: z.array(z.string().cuid()).optional(),
  customerNotes: z.string().max(2000).optional(),
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
  adminNotes: z.string().max(2000).optional(),
  gradedCondition: z
    .enum(['NEW', 'PRE_OWNED_EXCELLENT', 'PRE_OWNED_GOOD', 'PRE_OWNED_FAIR'])
    .optional(),
});

export type TradeQuoteInput = z.infer<typeof tradeQuoteSchema>;
export type CreateTradeRequestInput = z.infer<typeof createTradeRequestSchema>;
export type AdminUpdateTradeRequestInput = z.infer<typeof adminUpdateTradeRequestSchema>;
