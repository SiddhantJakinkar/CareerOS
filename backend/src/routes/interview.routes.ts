import { Router } from 'express';
import {
  startInterview,
  submitAnswer,
  getInterviewReport,
  getInterviews,
  getInterviewDomains,
  startInterviewSchema,
  answerSchema,
} from '../controllers/interview.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.get('/', getInterviews);
router.get('/domains', getInterviewDomains);
router.post('/start', aiLimiter, validate(startInterviewSchema), startInterview);
router.post('/answer', aiLimiter, validate(answerSchema), submitAnswer);
router.get('/report/:id', getInterviewReport);

export default router;
