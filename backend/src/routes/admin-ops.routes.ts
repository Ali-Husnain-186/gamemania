import { Router } from 'express';
import {
  adminListCustomersController,
  adminListOrdersController,
  adminUpdateOrderController,
  dashboardStatsController,
  getSettingController,
  listShippingRulesController,
  updateSettingController,
  updateShippingRulesController,
} from '../controllers/admin.controller';
import { authenticate, requirePermissions } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  adminCustomersQuerySchema,
  adminOrdersQuerySchema,
  adminUpdateOrderSchema,
  orderIdParamsSchema,
  settingKeyParamsSchema,
  shippingRulesPatchSchema,
  updateSettingSchema,
} from '../validators/admin.validators';

const router = Router();

router.use(authenticate);

router.get('/dashboard/stats', dashboardStatsController);

router.get(
  '/orders',
  requirePermissions('orders:read'),
  validate(adminOrdersQuerySchema, 'query'),
  adminListOrdersController,
);
router.patch(
  '/orders/:id',
  requirePermissions('orders:write'),
  validate(orderIdParamsSchema, 'params'),
  validate(adminUpdateOrderSchema),
  adminUpdateOrderController,
);

router.get(
  '/customers',
  requirePermissions('customers:read'),
  validate(adminCustomersQuerySchema, 'query'),
  adminListCustomersController,
);

router.get('/shipping-rules', listShippingRulesController);
router.patch(
  '/shipping-rules',
  requirePermissions('shipping:write'),
  validate(shippingRulesPatchSchema),
  updateShippingRulesController,
);

router.get('/settings/:key', validate(settingKeyParamsSchema, 'params'), getSettingController);
router.patch(
  '/settings/:key',
  requirePermissions('settings:write'),
  validate(settingKeyParamsSchema, 'params'),
  validate(updateSettingSchema),
  updateSettingController,
);

export const adminOpsRouter = router;
