import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.js';
import { cacheDel, cacheGetOrSet, CacheKey, CacheTTL } from '../utils/cache.js';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifications = await Notification.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isRead: true }
    );
    cacheDel(CacheKey.notifUnread(userId));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    await Notification.updateMany({ userId }, { isRead: true });
    cacheDel(CacheKey.notifUnread(userId));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const count = await cacheGetOrSet(CacheKey.notifUnread(userId), CacheTTL.SHORT, async () =>
      Notification.countDocuments({ userId, isRead: false })
    );
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
}
