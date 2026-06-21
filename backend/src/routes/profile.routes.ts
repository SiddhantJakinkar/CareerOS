import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  completeOnboarding,
  profileUpdateSchema,
  onboardingSchema,
} from '../controllers/profile.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getProfile);
router.put('/', validate(profileUpdateSchema), updateProfile);
router.post('/onboarding', validate(onboardingSchema), completeOnboarding);

export default router;
