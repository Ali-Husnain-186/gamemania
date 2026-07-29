import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  forgotPasswordController,
  googleCallbackController,
  googleStartController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  resetPasswordController,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '../validators/auth.validators';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many auth attempts. Try again later.' },
  },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many reset attempts. Try again later.' },
  },
});

router.post('/register', authLimiter, validate(registerSchema), registerController);
router.post('/login', authLimiter, validate(loginSchema), loginController);
router.post(
  '/forgot-password',
  resetLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordController,
);
router.post(
  '/reset-password',
  resetLimiter,
  validate(resetPasswordSchema),
  resetPasswordController,
);
router.post('/refresh', authLimiter, refreshController);
router.post('/logout', authenticate, logoutController);
router.get('/me', authenticate, meController);
router.get('/google', authLimiter, googleStartController);
router.get('/google/callback', authLimiter, googleCallbackController);

export const authRouter = router;
