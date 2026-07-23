import { Router } from 'express';
import {
  getProductController,
  listBrandsController,
  listCategoriesController,
  listProductsController,
} from '../controllers/catalog.controller';
import { validate } from '../middlewares/validate';
import { productListQuerySchema } from '../validators/catalog.validators';

const router = Router();

router.get('/products', validate(productListQuerySchema, 'query'), listProductsController);
router.get('/products/:slug', getProductController);
router.get('/categories', listCategoriesController);
router.get('/brands', listBrandsController);

export const catalogRouter = router;
