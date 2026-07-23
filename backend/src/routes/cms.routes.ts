import { Router } from 'express';
import {
  getBlogPostController,
  getCmsPageController,
  listBlogPostsController,
} from '../controllers/cms.controller';
import { validate } from '../middlewares/validate';
import { blogSlugParamsSchema, cmsSlugParamsSchema } from '../validators/cms.validators';

const cmsRouter = Router();

cmsRouter.get('/pages/:slug', validate(cmsSlugParamsSchema, 'params'), getCmsPageController);

const blogRouter = Router();

blogRouter.get('/', listBlogPostsController);
blogRouter.get('/:slug', validate(blogSlugParamsSchema, 'params'), getBlogPostController);

export { cmsRouter, blogRouter };
