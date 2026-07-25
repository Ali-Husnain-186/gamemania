import { Router } from 'express';
import { stripeWebhookController } from '../controllers/stripe.controller';

const router = Router();

/** Stripe sends raw body — mounted with express.raw in app.ts */
router.post('/stripe/webhook', stripeWebhookController);

export const paymentsRouter = router;
