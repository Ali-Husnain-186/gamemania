import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { shippingQuoteController } from '../controllers/shipping.controller';
import { authRouter } from './auth.routes';
import { catalogRouter } from './catalog.routes';
import { cartRouter } from './cart.routes';
import { wishlistRouter } from './wishlist.routes';
import { adminRouter } from './admin.routes';

const router = Router();

router.get('/health', healthController);
router.get('/shipping/quote', shippingQuoteController);
router.use('/auth', authRouter);
router.use(catalogRouter);
router.use('/cart', cartRouter);
router.use('/wishlist', wishlistRouter);
router.use('/admin', adminRouter);

export const v1Router = router;
