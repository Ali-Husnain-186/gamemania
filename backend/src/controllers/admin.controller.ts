import type { Request, Response, NextFunction } from 'express';
import { ok } from '../utils/apiResponse';
import * as adminService from '../services/admin.service';
import * as auditService from '../services/audit.service';
import type {
  AdminCustomersQuery,
  AdminOrdersQuery,
  ShippingRulesPatchInput,
  UpdateSettingInput,
} from '../validators/admin.validators';

export async function dashboardStatsController(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.getDashboardStats());
  } catch (err) {
    next(err);
  }
}

export async function adminListOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.adminListOrders(req.query as unknown as AdminOrdersQuery));
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await adminService.adminUpdateOrderStatus(req.params.id, req.body.status);
    await auditService.writeAuditLog({
      userId: req.user?.id,
      action: 'order.status_update',
      entityType: 'Order',
      entityId: order.id,
      metadata: { status: req.body.status },
      ipAddress: req.ip,
    });
    ok(res, order);
  } catch (err) {
    next(err);
  }
}

export async function adminListCustomersController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    ok(res, await adminService.adminListCustomers(req.query as unknown as AdminCustomersQuery));
  } catch (err) {
    next(err);
  }
}

export async function listShippingRulesController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    ok(res, await adminService.listShippingRules());
  } catch (err) {
    next(err);
  }
}

export async function updateShippingRulesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rules = await adminService.updateShippingRules(
      (req.body as ShippingRulesPatchInput).rules,
    );
    await auditService.writeAuditLog({
      userId: req.user?.id,
      action: 'shipping.rules_update',
      entityType: 'ShippingRule',
      ipAddress: req.ip,
    });
    ok(res, rules);
  } catch (err) {
    next(err);
  }
}

export async function getSettingController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await adminService.getSetting(req.params.key));
  } catch (err) {
    next(err);
  }
}

export async function updateSettingController(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body as UpdateSettingInput;
    const setting = await adminService.updateSetting(req.params.key, body.value, body.group);
    await auditService.writeAuditLog({
      userId: req.user?.id,
      action: 'setting.update',
      entityType: 'Setting',
      entityId: req.params.key,
      ipAddress: req.ip,
    });
    ok(res, setting);
  } catch (err) {
    next(err);
  }
}
