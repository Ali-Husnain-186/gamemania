import { Router } from 'express';
import { z } from 'zod';
import {
  addWishlistController,
  listWishlistController,
  removeWishlistController,
} from '../controllers/wishlist.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { addWishlistSchema } from '../validators/wishlist.validators';

const wishlistProductParamsSchema = z.object({
  productId: z.string().min(1),
});

const router = Router();

router.use(authenticate);
router.get('/', listWishlistController);
router.post('/', validate(addWishlistSchema), addWishlistController);
router.delete(
  '/:productId',
  validate(wishlistProductParamsSchema, 'params'),
  removeWishlistController,
);

export const wishlistRouter = router;
