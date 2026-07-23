import { Router } from 'express';
import {
  addCartItemController,
  getCartController,
  mergeCartController,
  removeCartItemController,
  updateCartItemController,
} from '../controllers/cart.controller';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  addCartItemSchema,
  cartItemParamsSchema,
  mergeCartSchema,
  updateCartItemSchema,
} from '../validators/cart.validators';

const router = Router();

router.get('/', optionalAuth, getCartController);
router.post('/items', optionalAuth, validate(addCartItemSchema), addCartItemController);
router.patch(
  '/items/:id',
  optionalAuth,
  validate(cartItemParamsSchema, 'params'),
  validate(updateCartItemSchema),
  updateCartItemController,
);
router.delete(
  '/items/:id',
  optionalAuth,
  validate(cartItemParamsSchema, 'params'),
  removeCartItemController,
);
router.post('/merge', authenticate, validate(mergeCartSchema), mergeCartController);

export const cartRouter = router;
