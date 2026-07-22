import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { shippingQuoteController } from '../controllers/shipping.controller';

const router = Router();

router.get('/health', healthController);
router.get('/shipping/quote', shippingQuoteController);

export const v1Router = router;
