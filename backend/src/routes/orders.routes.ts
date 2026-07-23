import { Router } from 'express';
import { getMyOrderController, listMyOrdersController } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { orderNumberParamsSchema } from '../validators/checkout.validators';

const router = Router();

router.use(authenticate);

router.get('/', listMyOrdersController);
router.get('/:orderNumber', validate(orderNumberParamsSchema, 'params'), getMyOrderController);

export const ordersRouter = router;
