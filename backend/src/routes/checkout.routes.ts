import { Router } from 'express';
import { checkoutController, checkoutPreviewController } from '../controllers/checkout.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { checkoutPreviewSchema, checkoutSchema } from '../validators/checkout.validators';

const router = Router();

router.use(authenticate);

router.post('/preview', validate(checkoutPreviewSchema), checkoutPreviewController);
router.post('/', validate(checkoutSchema), checkoutController);

export const checkoutRouter = router;
