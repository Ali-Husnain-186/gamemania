import type { Request, Response, NextFunction } from 'express';
import { ok } from '../utils/apiResponse';
import * as orderService from '../services/order.service';

export async function listMyOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await orderService.listMyOrders(req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function getMyOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await orderService.getOrderByNumber(req.user!.id, req.params.orderNumber));
  } catch (err) {
    next(err);
  }
}
