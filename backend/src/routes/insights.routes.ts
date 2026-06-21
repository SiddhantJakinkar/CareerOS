import { Router } from 'express';
import {
  companyResearch,
  getCompanyResearch,
  salaryPrediction,
  getSalaryPrediction,
  autoApplyPrepare,
  jobIdSchema,
  salarySchema,
} from '../controllers/insights.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.post('/company-research', aiLimiter, validate(jobIdSchema), companyResearch);
router.get('/company-research/:jobId', getCompanyResearch);
router.post('/salary-prediction', aiLimiter, validate(salarySchema), salaryPrediction);
router.get('/salary-prediction', getSalaryPrediction);
router.post('/auto-apply/:jobId', aiLimiter, autoApplyPrepare);

export default router;
