import { Router } from 'express';
import {
  adminCreateBlogPostController,
  adminCreatePageController,
  adminDeleteBlogPostController,
  adminDeletePageController,
  adminListBlogPostsController,
  adminListPagesController,
  adminUpdateBlogPostController,
  adminUpdatePageController,
} from '../controllers/cms.controller';
import { authenticate, requirePermissions } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  cmsIdParamsSchema,
  createBlogPostSchema,
  createCmsPageSchema,
  updateBlogPostSchema,
  updateCmsPageSchema,
} from '../validators/cms.validators';

const router = Router();

router.use(authenticate);
router.use(requirePermissions('cms:write'));

router.get('/pages', adminListPagesController);
router.post('/pages', validate(createCmsPageSchema), adminCreatePageController);
router.patch(
  '/pages/:id',
  validate(cmsIdParamsSchema, 'params'),
  validate(updateCmsPageSchema),
  adminUpdatePageController,
);
router.delete('/pages/:id', validate(cmsIdParamsSchema, 'params'), adminDeletePageController);

router.get('/blog', adminListBlogPostsController);
router.post('/blog', validate(createBlogPostSchema), adminCreateBlogPostController);
router.patch(
  '/blog/:id',
  validate(cmsIdParamsSchema, 'params'),
  validate(updateBlogPostSchema),
  adminUpdateBlogPostController,
);
router.delete('/blog/:id', validate(cmsIdParamsSchema, 'params'), adminDeleteBlogPostController);

export const adminCmsRouter = router;
