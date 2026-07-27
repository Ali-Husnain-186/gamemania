import type { Request, Response, NextFunction } from 'express';
import { ok } from '../utils/apiResponse';
import * as cartService from '../services/cart.service';
import type { AddCartItemInput, UpdateCartItemInput } from '../validators/cart.validators';

function ids(req: Request) {
  return {
    userId: req.user?.id,
    guestId: (req.header('X-Guest-Id') ?? undefined) || undefined,
  };
}

export async function getCartController(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, guestId } = ids(req);
    ok(res, await cartService.getCart(userId, guestId));
  } catch (err) {
    next(err);
  }
}

export async function addCartItemController(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as AddCartItemInput;
    const { userId, guestId } = ids(req);
    ok(
      res,
      await cartService.addCartItem(body.productId, body.quantity, userId, guestId, {
        isTradeIn: body.isTradeIn,
        tradePayoutMethod: body.tradePayoutMethod,
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function updateCartItemController(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as UpdateCartItemInput;
    const { userId, guestId } = ids(req);
    ok(res, await cartService.updateCartItem(req.params.id, body.quantity, userId, guestId));
  } catch (err) {
    next(err);
  }
}

export async function removeCartItemController(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, guestId } = ids(req);
    ok(res, await cartService.removeCartItem(req.params.id, userId, guestId));
  } catch (err) {
    next(err);
  }
}

export async function mergeCartController(req: Request, res: Response, next: NextFunction) {
  try {
    const bodyGuestId = (req.body as { guestId?: string }).guestId;
    const guestId = bodyGuestId?.trim() || req.header('X-Guest-Id') || undefined;
    ok(res, await cartService.mergeGuestCart(req.user!.id, guestId));
  } catch (err) {
    next(err);
  }
}
