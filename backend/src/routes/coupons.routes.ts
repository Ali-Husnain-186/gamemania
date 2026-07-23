import { Router } from 'express';
import { validateCouponController } from '../controllers/coupon.controller';
import { optionalAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { validateCouponSchema } from '../validators/coupon.validators';

const router = Router();

router.post('/validate', optionalAuth, validate(validateCouponSchema), validateCouponController);

export const couponsRouter = router;
