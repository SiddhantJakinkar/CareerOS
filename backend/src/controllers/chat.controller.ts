import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import {
  listConversations,
  getConversation,
  deleteConversation,
  sendMessage,
} from '../services/chat.service.js';
import { logActivity } from '../services/recommendation.service.js';

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  chatId: z.string().optional(),
});

export async function getConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const chats = await listConversations(req.user!.userId);
    res.json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
}

export async function getChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const chat = await getConversation(req.user!.userId, String(req.params.id));
    res.json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
}

export async function postMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { message, chatId } = req.body;

    const result = await sendMessage(userId, message, chatId);
    await logActivity(userId, 'chat', 'career_copilot', result.chat._id.toString());

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function removeChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteConversation(req.user!.userId, String(req.params.id));
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    next(error);
  }
}
