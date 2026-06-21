import { Router } from 'express';
import {
  uploadResume,
  analyzeResumeHandler,
  getResumeReport,
  generateResumeHandler,
  getResumes,
  generateResumeSchema,
} from '../controllers/resume.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { uploadResume as uploadMiddleware } from '../middleware/upload.js';
import { uploadLimiter, aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadLimiter, uploadMiddleware.single('resume'), uploadResume);
router.post('/analyze', aiLimiter, analyzeResumeHandler);
router.get('/report', getResumeReport);
router.get('/', getResumes);
router.post('/generate', aiLimiter, validate(generateResumeSchema), generateResumeHandler);

export default router;
