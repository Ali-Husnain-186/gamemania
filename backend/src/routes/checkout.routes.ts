import { Router } from 'express';
import {
  checkoutController,
  checkoutOrderPayController,
  checkoutOrderStatusController,
  checkoutPreviewController,
} from '../controllers/checkout.controller';
import { optionalAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  checkoutOrderLookupQuerySchema,
  checkoutOrderPaySchema,
  checkoutPreviewSchema,
  checkoutSchema,
  orderNumberParamsSchema,
} from '../validators/checkout.validators';

const router = Router();

router.use(optionalAuth);

router.post('/preview', validate(checkoutPreviewSchema), checkoutPreviewController);
router.post('/', validate(checkoutSchema), checkoutController);
router.get(
  '/orders/:orderNumber',
  validate(orderNumberParamsSchema, 'params'),
  validate(checkoutOrderLookupQuerySchema, 'query'),
  checkoutOrderStatusController,
);
router.post(
  '/orders/:orderNumber/pay',
  validate(orderNumberParamsSchema, 'params'),
  validate(checkoutOrderPaySchema),
  checkoutOrderPayController,
);

export const checkoutRouter = router;
