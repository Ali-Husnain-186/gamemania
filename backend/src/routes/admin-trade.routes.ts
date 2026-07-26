import { Router } from 'express';
import {
  adminDeleteTradeRequestController,
  adminListTradeRequestsController,
  adminUpdateTradeRequestController,
} from '../controllers/trade-in.controller';
import { authenticate, requirePermissions } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  adminUpdateTradeRequestSchema,
  tradeRequestIdParamsSchema,
} from '../validators/trade-in.validators';

const router = Router();

router.use(authenticate);

router.get('/requests', requirePermissions('trade:read'), adminListTradeRequestsController);
router.patch(
  '/requests/:id',
  requirePermissions('trade:write'),
  validate(tradeRequestIdParamsSchema, 'params'),
  validate(adminUpdateTradeRequestSchema),
  adminUpdateTradeRequestController,
);
router.delete(
  '/requests/:id',
  requirePermissions('trade:write'),
  validate(tradeRequestIdParamsSchema, 'params'),
  adminDeleteTradeRequestController,
);

export const adminTradeRouter = router;
