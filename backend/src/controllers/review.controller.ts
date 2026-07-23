import type { Request, Response, NextFunction } from 'express';
import { created, ok } from '../utils/apiResponse';
import * as reviewService from '../services/review.service';
import type { CreateReviewInput, ListReviewsQuery } from '../validators/review.validators';

export async function listReviewsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as ListReviewsQuery;
    ok(res, await reviewService.listProductReviews(query.productId));
  } catch (err) {
    next(err);
  }
}

export async function createReviewController(req: Request, res: Response, next: NextFunction) {
  try {
    created(res, await reviewService.createReview(req.user!.id, req.body as CreateReviewInput));
  } catch (err) {
    next(err);
  }
}

export async function adminListReviewsController(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await reviewService.adminListReviews());
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateReviewController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await reviewService.adminUpdateReview(req.params.id, req.body.status));
  } catch (err) {
    next(err);
  }
}
