import { Router } from 'express';
import { createReviewController, listReviewsController } from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createReviewSchema, listReviewsQuerySchema } from '../validators/review.validators';

const router = Router();

router.get('/', validate(listReviewsQuerySchema, 'query'), listReviewsController);
router.post('/', authenticate, validate(createReviewSchema), createReviewController);

export const reviewsRouter = router;
