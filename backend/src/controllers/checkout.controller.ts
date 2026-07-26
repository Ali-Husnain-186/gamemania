import type { Request, Response, NextFunction } from 'express';
import { created, ok } from '../utils/apiResponse';
import * as checkoutService from '../services/checkout.service';
import type { CheckoutInput, CheckoutPreviewInput } from '../validators/checkout.validators';

function actorFrom(req: Request) {
  return {
    userId: req.user?.id,
    guestId: (req.header('X-Guest-Id') ?? undefined) || undefined,
  };
}

export async function checkoutPreviewController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(
      res,
      await checkoutService.previewCheckout(actorFrom(req), req.body as CheckoutPreviewInput),
    );
  } catch (err) {
    next(err);
  }
}

export async function checkoutController(req: Request, res: Response, next: NextFunction) {
  try {
    created(res, await checkoutService.placeOrder(actorFrom(req), req.body as CheckoutInput));
  } catch (err) {
    next(err);
  }
}
