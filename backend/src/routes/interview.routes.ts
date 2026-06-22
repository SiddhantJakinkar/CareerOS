import { Router } from 'express';
import {
  startInterview,
  submitAnswer,
  submitVideoAnswer,
  getInterviewReport,
  getInterviews,
  getInterviewDomains,
  startInterviewSchema,
  answerSchema,
  videoAnswerSchema,
} from '../controllers/interview.controller.js';
import {
  createInterviewInvite,
  getInterviewInvitePublic,
  listMyInvites,
  startLive,
  liveTurn,
  createInviteSchema,
  startLiveSchema,
  liveTurnSchema,
} from '../controllers/liveInterview.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter, uploadLimiter } from '../middleware/rateLimiter.js';
import { uploadVideo } from '../middleware/upload.js';
import { uploadAudio } from '../middleware/upload.js';

const router = Router();

router.get('/invites/public/:token', getInterviewInvitePublic);

router.use(authenticate);

router.get('/', getInterviews);
router.get('/domains', getInterviewDomains);
router.post('/start', aiLimiter, validate(startInterviewSchema), startInterview);
router.post('/answer', aiLimiter, validate(answerSchema), submitAnswer);
router.post(
  '/video-answer',
  uploadLimiter,
  aiLimiter,
  uploadVideo.single('video'),
  validate(videoAnswerSchema),
  submitVideoAnswer
);

router.post('/invites', validate(createInviteSchema), createInterviewInvite);
router.get('/invites', listMyInvites);
router.post('/live/start', aiLimiter, validate(startLiveSchema), startLive);
router.post(
  '/live/turn',
  uploadLimiter,
  aiLimiter,
  uploadAudio.single('audio'),
  validate(liveTurnSchema),
  liveTurn
);

router.get('/report/:id', getInterviewReport);

export default router;
