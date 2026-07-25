import { Router } from 'express';
import {
  createReviewController,
  listFeaturedReviewsController,
  listReviewsController,
} from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createReviewSchema,
  featuredReviewsQuerySchema,
  listReviewsQuerySchema,
} from '../validators/review.validators';

const router = Router();

router.get(
  '/featured',
  validate(featuredReviewsQuerySchema, 'query'),
  listFeaturedReviewsController,
);
router.get('/', validate(listReviewsQuerySchema, 'query'), listReviewsController);
router.post('/', authenticate, validate(createReviewSchema), createReviewController);

export const reviewsRouter = router;
