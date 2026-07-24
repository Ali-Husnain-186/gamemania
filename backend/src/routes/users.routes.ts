import { Router } from 'express';
import { updateProfileController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateProfileSchema } from '../validators/user.validators';

const router = Router();

router.use(authenticate);

router.patch('/', validate(updateProfileSchema), updateProfileController);

export const usersMeRouter = router;
