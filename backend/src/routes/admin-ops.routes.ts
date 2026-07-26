import { Router } from 'express';
import {
  adminDeleteCustomerController,
  adminDeleteOrderController,
  adminListCustomersController,
  adminListOrdersController,
  adminUpdateOrderController,
  dashboardStatsController,
  deleteShippingRuleController,
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
  customerIdParamsSchema,
  orderIdParamsSchema,
  settingKeyParamsSchema,
  shippingRuleIdParamsSchema,
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
router.delete(
  '/orders/:id',
  requirePermissions('orders:write'),
  validate(orderIdParamsSchema, 'params'),
  adminDeleteOrderController,
);

router.get(
  '/customers',
  requirePermissions('customers:read'),
  validate(adminCustomersQuerySchema, 'query'),
  adminListCustomersController,
);
router.delete(
  '/customers/:id',
  requirePermissions('customers:write'),
  validate(customerIdParamsSchema, 'params'),
  adminDeleteCustomerController,
);

router.get('/shipping-rules', listShippingRulesController);
router.patch(
  '/shipping-rules',
  requirePermissions('shipping:write'),
  validate(shippingRulesPatchSchema),
  updateShippingRulesController,
);
router.delete(
  '/shipping-rules/:id',
  requirePermissions('shipping:write'),
  validate(shippingRuleIdParamsSchema, 'params'),
  deleteShippingRuleController,
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
