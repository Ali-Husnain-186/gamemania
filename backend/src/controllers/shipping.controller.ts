import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { quoteShipping } from '../services/shipping.service';

const querySchema = z.object({
  subtotal: z.coerce.number().int().min(0),
  country: z.string().length(2).default('GB'),
});

export async function shippingQuoteController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { subtotal, country } = querySchema.parse(req.query);
    const quote = await quoteShipping(subtotal, country.toUpperCase());
    res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
}
