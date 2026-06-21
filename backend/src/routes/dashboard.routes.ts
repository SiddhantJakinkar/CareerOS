import { Router } from 'express';
import { getDashboard, getReports, getAnalytics } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getDashboard);
router.get('/reports', getReports);
router.get('/analytics', getAnalytics);

export default router;
