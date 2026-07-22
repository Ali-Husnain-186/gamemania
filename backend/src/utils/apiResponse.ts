import type { Response } from 'express';

export function ok<T>(res: Response, data: T, status = 200, meta?: unknown): void {
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, 201);
}
