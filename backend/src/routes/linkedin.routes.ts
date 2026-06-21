import { Router } from 'express';
import { analyzeLinkedInProfile, linkedinSchema } from '../controllers/linkedin.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.post('/analyze', aiLimiter, validate(linkedinSchema), analyzeLinkedInProfile);

export default router;
