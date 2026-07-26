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

export async function adminDeleteOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.adminDeleteOrder(req.params.id);
    await auditService.writeAuditLog({
      userId: req.user?.id,
      action: 'order.delete',
      entityType: 'Order',
      entityId: req.params.id,
      ipAddress: req.ip,
    });
    ok(res, result);
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

export async function adminDeleteCustomerController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await adminService.adminDeleteCustomer(req.params.id);
    await auditService.writeAuditLog({
      userId: req.user?.id,
      action: 'customer.delete',
      entityType: 'User',
      entityId: req.params.id,
      ipAddress: req.ip,
    });
    ok(res, result);
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

export async function deleteShippingRuleController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await adminService.deleteShippingRule(req.params.id);
    await auditService.writeAuditLog({
      userId: req.user?.id,
      action: 'shipping.rule_delete',
      entityType: 'ShippingRule',
      entityId: req.params.id,
      ipAddress: req.ip,
    });
    ok(res, result);
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
