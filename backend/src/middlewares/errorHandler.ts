import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../exceptions/AppError';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const flattened = err.flatten();
    const firstFieldMessage = Object.values(flattened.fieldErrors).flat()[0];
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: firstFieldMessage || flattened.formErrors[0] || 'Validation failed',
        details: flattened,
      },
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 8MB or smaller.'
        : err.message || 'Upload failed';
    res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isProd ? 'Internal server error' : String(err),
    },
  });
}
