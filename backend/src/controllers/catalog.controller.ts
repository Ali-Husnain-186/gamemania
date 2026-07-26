import type { Request, Response, NextFunction } from 'express';
import { created, ok } from '../utils/apiResponse';
import * as auditService from '../services/audit.service';
import * as catalogService from '../services/catalog.service';
import type {
  CreateProductInput,
  ProductListQuery,
  UpdateProductInput,
} from '../validators/catalog.validators';

export async function listProductsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as ProductListQuery;
    const result = await catalogService.listProducts(query, false);
    ok(res, result.items, 200, result.meta);
  } catch (err) {
    next(err);
  }
}

export async function getProductController(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await catalogService.getProductBySlug(req.params.slug);
    ok(res, product);
  } catch (err) {
    next(err);
  }
}

export async function listCategoriesController(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await catalogService.listCategories());
  } catch (err) {
    next(err);
  }
}

export async function listBrandsController(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await catalogService.listBrands());
  } catch (err) {
    next(err);
  }
}

export async function adminListProductsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as ProductListQuery;
    const result = await catalogService.listProducts(query, true);
    ok(res, result.items, 200, result.meta);
  } catch (err) {
    next(err);
  }
}

export async function adminCreateProductController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await catalogService.createProduct(req.body as CreateProductInput);
    await auditService.writeAuditLog({
      userId: req.user?.id,
      action: 'product.create',
      entityType: 'Product',
      entityId: product.id,
      ipAddress: req.ip,
    });
    created(res, product);
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateProductController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const product = await catalogService.updateProduct(
      req.params.id,
      req.body as UpdateProductInput,
    );
    await auditService.writeAuditLog({
      userId: req.user?.id,
      action: 'product.update',
      entityType: 'Product',
      entityId: product.id,
      metadata: req.body as Record<string, unknown>,
      ipAddress: req.ip,
    });
    ok(res, product);
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteProductController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await catalogService.deleteProduct(req.params.id);
    await auditService.writeAuditLog({
      userId: req.user?.id,
      action: 'product.delete',
      entityType: 'Product',
      entityId: req.params.id,
      ipAddress: req.ip,
    });
    ok(res, result);
  } catch (err) {
    next(err);
  }
}
