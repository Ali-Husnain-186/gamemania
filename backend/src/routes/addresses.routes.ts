import { Router } from 'express';
import {
  createAddressController,
  deleteAddressController,
  listAddressesController,
  updateAddressController,
} from '../controllers/address.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  addressIdParamsSchema,
  createAddressSchema,
  updateAddressSchema,
} from '../validators/address.validators';

const router = Router();

router.use(authenticate);

router.get('/', listAddressesController);
router.post('/', validate(createAddressSchema), createAddressController);
router.patch(
  '/:id',
  validate(addressIdParamsSchema, 'params'),
  validate(updateAddressSchema),
  updateAddressController,
);
router.delete('/:id', validate(addressIdParamsSchema, 'params'), deleteAddressController);

export const addressesRouter = router;
