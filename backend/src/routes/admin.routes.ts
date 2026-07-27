import { Router } from 'express';
import { z } from 'zod';
import {
  adminCreateProductController,
  adminDeleteProductController,
  adminListProductsController,
  adminUpdateProductController,
  adminListCategoriesController,
  adminCreateCategoryController,
  adminUpdateCategoryController,
  adminDeleteCategoryController,
  adminListBrandsController,
  adminCreateBrandController,
  adminUpdateBrandController,
  adminDeleteBrandController,
} from '../controllers/catalog.controller';
import { signUploadController, uploadImageController } from '../controllers/upload.controller';
import { authenticate, requirePermissions } from '../middlewares/auth';
import { productImageUpload } from '../middlewares/upload';
import { validate } from '../middlewares/validate';
import {
  createProductSchema,
  productListQuerySchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  createBrandSchema,
  updateBrandSchema,
} from '../validators/catalog.validators';
import { adminCmsRouter } from './admin-cms.routes';
import { adminOpsRouter } from './admin-ops.routes';
import { adminReviewsRouter } from './admin-reviews.routes';
import { adminTradeRouter } from './admin-trade.routes';

const productIdParamsSchema = z.object({
  id: z.string().cuid(),
});

const idParamsSchema = z.object({
  id: z.string().cuid(),
});

const router = Router();

router.use(authenticate);

router.post('/uploads/sign', requirePermissions('products:write'), signUploadController);
router.post(
  '/uploads/image',
  requirePermissions('products:write'),
  productImageUpload.single('file'),
  uploadImageController,
);

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
router.delete(
  '/products/:id',
  requirePermissions('products:write'),
  validate(productIdParamsSchema, 'params'),
  adminDeleteProductController,
);

router.get('/categories', requirePermissions('products:read'), adminListCategoriesController);
router.post(
  '/categories',
  requirePermissions('products:write'),
  validate(createCategorySchema),
  adminCreateCategoryController,
);
router.patch(
  '/categories/:id',
  requirePermissions('products:write'),
  validate(idParamsSchema, 'params'),
  validate(updateCategorySchema),
  adminUpdateCategoryController,
);
router.delete(
  '/categories/:id',
  requirePermissions('products:write'),
  validate(idParamsSchema, 'params'),
  adminDeleteCategoryController,
);

router.get('/brands', requirePermissions('products:read'), adminListBrandsController);
router.post(
  '/brands',
  requirePermissions('products:write'),
  validate(createBrandSchema),
  adminCreateBrandController,
);
router.patch(
  '/brands/:id',
  requirePermissions('products:write'),
  validate(idParamsSchema, 'params'),
  validate(updateBrandSchema),
  adminUpdateBrandController,
);
router.delete(
  '/brands/:id',
  requirePermissions('products:write'),
  validate(idParamsSchema, 'params'),
  adminDeleteBrandController,
);

router.use('/trade-in', adminTradeRouter);
router.use('/reviews', adminReviewsRouter);
router.use('/cms', adminCmsRouter);
router.use(adminOpsRouter);

export const adminRouter = router;
