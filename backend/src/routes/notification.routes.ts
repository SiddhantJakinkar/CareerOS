import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllRead,
  getUnreadCount,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markAsRead);

export default router;
