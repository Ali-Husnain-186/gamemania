import { Router } from 'express';
import { z } from 'zod';
import {
  adminCreateProductController,
  adminListProductsController,
  adminUpdateProductController,
} from '../controllers/catalog.controller';
import { authenticate, requirePermissions } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createProductSchema,
  productListQuerySchema,
  updateProductSchema,
} from '../validators/catalog.validators';

const productIdParamsSchema = z.object({
  id: z.string().cuid(),
});

const router = Router();

router.use(authenticate);

router.get(
  '/products',
  requirePermissions('products:read'),
  validate(productListQuerySchema, 'query'),
  adminListProductsController,
);
router.post(
  '/products',
  requirePermissions('products:write'),
  validate(createProductSchema),
  adminCreateProductController,
);
router.patch(
  '/products/:id',
  requirePermissions('products:write'),
  validate(productIdParamsSchema, 'params'),
  validate(updateProductSchema),
  adminUpdateProductController,
);

export const adminRouter = router;
