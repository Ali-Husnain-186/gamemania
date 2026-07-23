import { Router } from 'express';
import { listNotificationsController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);
router.get('/', listNotificationsController);

export const notificationsRouter = router;
