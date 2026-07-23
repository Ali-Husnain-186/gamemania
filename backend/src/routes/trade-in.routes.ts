import { Router } from 'express';
import {
  createTradeRequestController,
  getConsolesController,
  getMyTradeRequestController,
  listMyTradeRequestsController,
  quoteTradeInController,
} from '../controllers/trade-in.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createTradeRequestSchema,
  tradeQuoteSchema,
  tradeRequestIdParamsSchema,
} from '../validators/trade-in.validators';

const router = Router();

router.get('/consoles', getConsolesController);
router.post('/quote', validate(tradeQuoteSchema), quoteTradeInController);

router.use(authenticate);

router.post('/requests', validate(createTradeRequestSchema), createTradeRequestController);
router.get('/requests', listMyTradeRequestsController);
router.get(
  '/requests/:id',
  validate(tradeRequestIdParamsSchema, 'params'),
  getMyTradeRequestController,
);

export const tradeInRouter = router;
