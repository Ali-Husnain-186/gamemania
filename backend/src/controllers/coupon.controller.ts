import type { Request, Response, NextFunction } from 'express';
import { ok } from '../utils/apiResponse';
import * as couponService from '../services/coupon.service';
import type { ValidateCouponInput } from '../validators/coupon.validators';

export async function validateCouponController(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as ValidateCouponInput;
    ok(res, await couponService.validateCoupon(body.code, body.subtotalPence, req.user?.id));
  } catch (err) {
    next(err);
  }
}
