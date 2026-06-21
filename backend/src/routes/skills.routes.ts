import { Router } from 'express';
import {
  getSkillGap,
  generateRoadmapHandler,
  getRoadmaps,
  updateRoadmapProgress,
  skillGapSchema,
  roadmapSchema,
} from '../controllers/skills.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.get('/gap', validate(skillGapSchema, 'query'), aiLimiter, getSkillGap);
router.post('/roadmap', aiLimiter, validate(roadmapSchema), generateRoadmapHandler);
router.get('/roadmap', getRoadmaps);
router.patch('/roadmap/:id', updateRoadmapProgress);

export default router;
