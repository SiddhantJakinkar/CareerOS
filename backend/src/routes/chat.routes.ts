import { Router } from 'express';
import {
  getConversations,
  getChat,
  postMessage,
  removeChat,
  sendMessageSchema,
} from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.get('/', getConversations);
router.get('/:id', getChat);
router.post('/', aiLimiter, validate(sendMessageSchema), postMessage);
router.delete('/:id', removeChat);

export default router;
