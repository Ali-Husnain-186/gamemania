import type { Request, Response } from 'express';
import * as stripeService from '../services/stripe.service';

export async function stripeWebhookController(req: Request, res: Response) {
  try {
    const signature = req.headers['stripe-signature'];
    const rawBody = req.body as Buffer;
    const result = await stripeService.handleStripeWebhook(
      rawBody,
      typeof signature === 'string' ? signature : undefined,
    );
    res.status(200).json(result);
  } catch (err) {
    console.error('[stripe.webhook]', err);
    res.status(400).json({
      success: false,
      error: {
        code: 'STRIPE_WEBHOOK_ERROR',
        message: err instanceof Error ? err.message : 'Webhook error',
      },
    });
  }
}
