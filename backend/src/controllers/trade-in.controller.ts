import type { Request, Response, NextFunction } from 'express';
import { created, ok } from '../utils/apiResponse';
import * as auditService from '../services/audit.service';
import * as tradeInService from '../services/trade-in.service';
import type {
  AdminUpdateTradeRequestInput,
  CreateTradeRequestInput,
  TradeQuoteInput,
} from '../validators/trade-in.validators';

export async function getConsolesController(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await tradeInService.getConsolesTree());
  } catch (err) {
    next(err);
  }
}

export async function quoteTradeInController(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as TradeQuoteInput;
    ok(res, await tradeInService.quoteTradeIn(body.modelOptionId, body.accessoryIds));
  } catch (err) {
    next(err);
  }
}

export async function createTradeRequestController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    created(
      res,
      await tradeInService.createTradeRequest(req.user!.id, req.body as CreateTradeRequestInput),
    );
  } catch (err) {
    next(err);
  }
}

export async function listMyTradeRequestsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    ok(res, await tradeInService.listUserTradeRequests(req.user!.id));
  } catch (err) {
    next(err);
  }
}

export async function getMyTradeRequestController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await tradeInService.getUserTradeRequest(req.user!.id, req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function adminListTradeRequestsController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    ok(res, await tradeInService.adminListTradeRequests());
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateTradeRequestController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const trade = await tradeInService.adminUpdateTradeRequest(
      req.params.id,
      req.body as AdminUpdateTradeRequestInput,
    );
    await auditService.writeAuditLog({
      userId: req.user?.id,
      action: 'trade.update',
      entityType: 'TradeRequest',
      entityId: trade.id,
      metadata: req.body as Record<string, unknown>,
      ipAddress: req.ip,
    });
    ok(res, trade);
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteTradeRequestController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await tradeInService.adminDeleteTradeRequest(req.params.id);
    await auditService.writeAuditLog({
      userId: req.user?.id,
      action: 'trade.delete',
      entityType: 'TradeRequest',
      entityId: req.params.id,
      ipAddress: req.ip,
    });
    ok(res, result);
  } catch (err) {
    next(err);
  }
}
