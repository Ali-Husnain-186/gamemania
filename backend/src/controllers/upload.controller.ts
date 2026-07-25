import type { Request, Response, NextFunction } from 'express';
import { ok } from '../utils/apiResponse';
import * as cloudinaryService from '../services/cloudinary.service';

export async function signUploadController(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, cloudinaryService.getSignedUploadParams());
  } catch (err) {
    next(err);
  }
}
