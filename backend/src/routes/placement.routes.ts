import { Router } from 'express';
import { getOverview, getCollegesList, getStudent } from '../controllers/placement.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'counselor'));

router.get('/overview', getOverview);
router.get('/colleges', getCollegesList);
router.get('/students/:userId', getStudent);

export default router;
