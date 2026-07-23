import type { Request, Response, NextFunction } from 'express';
import { created, ok } from '../utils/apiResponse';
import * as checkoutService from '../services/checkout.service';
import type { CheckoutInput, CheckoutPreviewInput } from '../validators/checkout.validators';

export async function checkoutPreviewController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await checkoutService.previewCheckout(req.user!.id, req.body as CheckoutPreviewInput));
  } catch (err) {
    next(err);
  }
}

export async function checkoutController(req: Request, res: Response, next: NextFunction) {
  try {
    created(res, await checkoutService.placeOrder(req.user!.id, req.body as CheckoutInput));
  } catch (err) {
    next(err);
  }
}
