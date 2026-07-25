import { Router } from 'express';
import { z } from 'zod';
import {
  adminCreateProductController,
  adminListProductsController,
  adminUpdateProductController,
} from '../controllers/catalog.controller';
import { signUploadController } from '../controllers/upload.controller';
import { authenticate, requirePermissions } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createProductSchema,
  productListQuerySchema,
  updateProductSchema,
} from '../validators/catalog.validators';
import { adminCmsRouter } from './admin-cms.routes';
import { adminOpsRouter } from './admin-ops.routes';
import { adminReviewsRouter } from './admin-reviews.routes';
import { adminTradeRouter } from './admin-trade.routes';

const productIdParamsSchema = z.object({
  id: z.string().cuid(),
});

const router = Router();

router.use(authenticate);

router.post('/uploads/sign', requirePermissions('products:write'), signUploadController);

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

router.use('/trade-in', adminTradeRouter);
router.use('/reviews', adminReviewsRouter);
router.use('/cms', adminCmsRouter);
router.use(adminOpsRouter);

export const adminRouter = router;
