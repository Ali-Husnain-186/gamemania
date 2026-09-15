import { Router } from 'express';
import { ok } from '../utils/apiResponse';
import * as adminService from '../services/admin.service';

const PUBLIC_SETTING_KEYS = new Set(['social.links', 'store.name', 'home.hero', 'promo.banner']);

const router = Router();

router.get('/:key', async (req, res, next) => {
  try {
    const key = req.params.key;
    if (!PUBLIC_SETTING_KEYS.has(key)) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Setting not found' },
      });
      return;
    }
    try {
      ok(res, await adminService.getSetting(key));
    } catch {
      ok(res, {
        key,
        value:
          key === 'social.links' ? [] : key === 'home.hero' || key === 'promo.banner' ? null : null,
      });
    }
  } catch (err) {
    next(err);
  }
});

export const publicSettingsRouter = router;
