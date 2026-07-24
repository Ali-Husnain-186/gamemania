import type { Request, Response, NextFunction } from 'express';
import { ok } from '../utils/apiResponse';
import * as userService from '../services/user.service';
import type { UpdateProfileInput } from '../validators/user.validators';

export async function updateProfileController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.updateProfile(req.user!.id, req.body as UpdateProfileInput);
    ok(res, { user });
  } catch (err) {
    next(err);
  }
}
