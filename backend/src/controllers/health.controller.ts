import type { Request, Response } from 'express';

export function healthController(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'game-mania-api',
      timestamp: new Date().toISOString(),
    },
  });
}
