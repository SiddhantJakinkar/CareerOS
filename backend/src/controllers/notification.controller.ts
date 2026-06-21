import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.js';

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
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Notification.updateMany({ userId: req.user!.userId }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await Notification.countDocuments({ userId: req.user!.userId, isRead: false });
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
}
