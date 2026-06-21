import { Router } from 'express';
import {
  listJobs,
  getRecommended,
  getTrending,
  getLatest,
  getJob,
  getJobMatchAnalysis,
  saveJob,
  unsaveJob,
  getSavedJobs,
  syncJobsFromNetwork,
  getSyncStatus,
  jobSearchSchema,
  jobSyncSchema,
} from '../controllers/job.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/', optionalAuthenticate, validate(jobSearchSchema, 'query'), listJobs);
router.get('/sync/status', getSyncStatus);
router.post('/sync', optionalAuthenticate, validate(jobSyncSchema), syncJobsFromNetwork);
router.get('/trending', getTrending);
router.get('/latest', getLatest);
router.get('/recommended', authenticate, getRecommended);
router.get('/saved', authenticate, getSavedJobs);
router.get('/:id', getJob);
router.get('/:id/match', authenticate, aiLimiter, getJobMatchAnalysis);
router.post('/:id/save', authenticate, saveJob);
router.delete('/:id/save', authenticate, unsaveJob);

export default router;
