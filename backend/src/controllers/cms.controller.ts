import type { Request, Response, NextFunction } from 'express';
import { created, ok } from '../utils/apiResponse';
import * as cmsService from '../services/cms.service';
import type {
  CreateBlogPostInput,
  CreateCmsPageInput,
  UpdateBlogPostInput,
  UpdateCmsPageInput,
} from '../validators/cms.validators';

export async function getCmsPageController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await cmsService.getPublishedPage(req.params.slug));
  } catch (err) {
    next(err);
  }
}

export async function listBlogPostsController(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await cmsService.listPublishedBlogPosts());
  } catch (err) {
    next(err);
  }
}

export async function getBlogPostController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await cmsService.getPublishedBlogPost(req.params.slug));
  } catch (err) {
    next(err);
  }
}

export async function adminListPagesController(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await cmsService.adminListPages());
  } catch (err) {
    next(err);
  }
}

export async function adminCreatePageController(req: Request, res: Response, next: NextFunction) {
  try {
    created(res, await cmsService.adminCreatePage(req.body as CreateCmsPageInput));
  } catch (err) {
    next(err);
  }
}

export async function adminUpdatePageController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await cmsService.adminUpdatePage(req.params.id, req.body as UpdateCmsPageInput));
  } catch (err) {
    next(err);
  }
}

export async function adminDeletePageController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await cmsService.adminDeletePage(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function adminListBlogPostsController(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    ok(res, await cmsService.adminListBlogPosts());
  } catch (err) {
    next(err);
  }
}

export async function adminCreateBlogPostController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    created(
      res,
      await cmsService.adminCreateBlogPost(req.user!.id, req.body as CreateBlogPostInput),
    );
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateBlogPostController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    ok(res, await cmsService.adminUpdateBlogPost(req.params.id, req.body as UpdateBlogPostInput));
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteBlogPostController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    ok(res, await cmsService.adminDeleteBlogPost(req.params.id));
  } catch (err) {
    next(err);
  }
}
