import type { Request, Response, NextFunction } from 'express';
import { created, ok } from '../utils/apiResponse';
import * as checkoutService from '../services/checkout.service';
import type {
  CheckoutInput,
  CheckoutOrderLookupQuery,
  CheckoutOrderPayInput,
  CheckoutPreviewInput,
} from '../validators/checkout.validators';

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

export async function checkoutOrderStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = req.query as CheckoutOrderLookupQuery;
    ok(
      res,
      await checkoutService.getCheckoutOrderStatus(
        actorFrom(req),
        req.params.orderNumber,
        query.email,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function checkoutOrderPayController(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as CheckoutOrderPayInput;
    ok(
      res,
      await checkoutService.retryCheckoutPayment(
        actorFrom(req),
        req.params.orderNumber,
        body.email,
      ),
    );
  } catch (err) {
    next(err);
  }
}
