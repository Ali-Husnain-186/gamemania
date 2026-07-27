import type { Request, Response, NextFunction } from 'express';
import { ok } from '../utils/apiResponse';
import { ValidationError } from '../exceptions/AppError';
import * as cloudinaryService from '../services/cloudinary.service';

export async function signUploadController(_req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, cloudinaryService.getSignedUploadParams());
  } catch (err) {
    next(err);
  }
}

export async function uploadImageController(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file?.buffer?.length) {
      throw new ValidationError('Please choose an image file to upload');
    }

    const uploaded = await cloudinaryService.uploadImageBuffer({
      buffer: file.buffer,
      filename: file.originalname,
      mimetype: file.mimetype,
      folder: 'game-mania/products',
    });

    ok(res, uploaded);
  } catch (err) {
    next(err);
  }
}
