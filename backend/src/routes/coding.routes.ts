import { Router } from 'express';
import {
  getTests,
  getTest,
  submitTest,
  getResults,
  generatePersonalized,
  submitTestSchema,
} from '../controllers/coding.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.get('/', getTests);
router.post('/personalized/generate', aiLimiter, generatePersonalized);
router.get('/results/all', getResults);
router.get('/:id', getTest);
router.post('/submit', validate(submitTestSchema), submitTest);

export default router;
