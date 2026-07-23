import type { Request, Response, NextFunction } from 'express';
import { ok } from '../utils/apiResponse';
import * as notificationService from '../services/notification.service';

export async function listNotificationsController(req: Request, res: Response, next: NextFunction) {
  try {
    ok(res, await notificationService.listNotifications(req.user!.id));
  } catch (err) {
    next(err);
  }
}
