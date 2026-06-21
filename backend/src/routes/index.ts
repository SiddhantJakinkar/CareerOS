import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import resumeRoutes from './resume.routes.js';
import jobRoutes from './job.routes.js';
import applicationRoutes from './application.routes.js';
import interviewRoutes from './interview.routes.js';
import voiceRoutes from './voice.routes.js';
import codingRoutes from './coding.routes.js';
import skillsRoutes from './skills.routes.js';
import linkedinRoutes from './linkedin.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import notificationRoutes from './notification.routes.js';
import chatRoutes from './chat.routes.js';
import insightsRoutes from './insights.routes.js';
import placementRoutes from './placement.routes.js';
import videoInterviewRoutes from './videoInterview.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/resume', resumeRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/interview', interviewRoutes);
router.use('/voice', voiceRoutes);
router.use('/tests', codingRoutes);
router.use('/skills', skillsRoutes);
router.use('/linkedin', linkedinRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/chat', chatRoutes);
router.use('/insights', insightsRoutes);
router.use('/placement', placementRoutes);
router.use('/video-interview', videoInterviewRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'AI Placement Copilot API is running' });
});

export default router;
