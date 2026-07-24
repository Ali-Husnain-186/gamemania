import { Router } from 'express';
import { healthController } from '../controllers/health.controller';
import { shippingQuoteController } from '../controllers/shipping.controller';
import { authRouter } from './auth.routes';
import { catalogRouter } from './catalog.routes';
import { cartRouter } from './cart.routes';
import { wishlistRouter } from './wishlist.routes';
import { adminRouter } from './admin.routes';
import { addressesRouter } from './addresses.routes';
import { usersMeRouter } from './users.routes';
import { couponsRouter } from './coupons.routes';
import { checkoutRouter } from './checkout.routes';
import { ordersRouter } from './orders.routes';
import { tradeInRouter } from './trade-in.routes';
import { reviewsRouter } from './reviews.routes';
import { cmsRouter, blogRouter } from './cms.routes';
import { notificationsRouter } from './notifications.routes';

const router = Router();

router.get('/health', healthController);
router.get('/shipping/quote', shippingQuoteController);
router.use('/auth', authRouter);
router.use(catalogRouter);
router.use('/cart', cartRouter);
router.use('/wishlist', wishlistRouter);
router.use('/users/me', usersMeRouter);
router.use('/users/me/addresses', addressesRouter);
router.use('/coupons', couponsRouter);
router.use('/checkout', checkoutRouter);
router.use('/orders', ordersRouter);
router.use('/trade-in', tradeInRouter);
router.use('/reviews', reviewsRouter);
router.use('/cms', cmsRouter);
router.use('/blog', blogRouter);
router.use('/notifications', notificationsRouter);
router.use('/admin', adminRouter);

export const v1Router = router;
