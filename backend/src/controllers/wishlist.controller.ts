import type { Request, Response, NextFunction } from 'express';
import { ok } from '../utils/apiResponse';
import * as wishlistService from '../services/wishlist.service';
import type { AddWishlistInput } from '../validators/wishlist.validators';

export async function listWishlistController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await wishlistService.listWishlist(req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function addWishlistController(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as AddWishlistInput;
    ok(res, await wishlistService.addWishlistItem(req.user!.id, body.productId));
  } catch (err) {
    next(err);
  }
}

export async function removeWishlistController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await wishlistService.removeWishlistItem(req.user!.id, req.params.productId));
  } catch (err) {
    next(err);
  }
}
