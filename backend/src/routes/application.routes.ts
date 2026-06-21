import { Router } from 'express';
import {
  createApplication,
  getApplications,
  updateApplication,
  generateCoverLetterHandler,
  getCoverLetter,
  applicationSchema,
  updateApplicationSchema,
  coverLetterSchema,
} from '../controllers/application.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.get('/', getApplications);
router.post('/', validate(applicationSchema), createApplication);
router.patch('/:id', validate(updateApplicationSchema), updateApplication);
router.post('/cover-letter', aiLimiter, validate(coverLetterSchema), generateCoverLetterHandler);
router.get('/cover-letter/:jobId', getCoverLetter);

export default router;
