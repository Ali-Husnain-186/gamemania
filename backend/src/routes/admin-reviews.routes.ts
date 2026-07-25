import { Router } from 'express';
import {
  adminDeleteReviewController,
  adminListReviewsController,
  adminUpdateReviewController,
} from '../controllers/review.controller';
import { authenticate, requirePermissions } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { adminUpdateReviewSchema, reviewIdParamsSchema } from '../validators/review.validators';

const router = Router();

router.use(authenticate);
router.use(requirePermissions('reviews:write'));

router.get('/', adminListReviewsController);
router.patch(
  '/:id',
  validate(reviewIdParamsSchema, 'params'),
  validate(adminUpdateReviewSchema),
  adminUpdateReviewController,
);
router.delete('/:id', validate(reviewIdParamsSchema, 'params'), adminDeleteReviewController);

export const adminReviewsRouter = router;
