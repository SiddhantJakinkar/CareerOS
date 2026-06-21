import { Router } from 'express';
import { transcribeVoice, evaluateVoice, voiceEvaluateSchema } from '../controllers/voice.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { uploadAudio } from '../middleware/upload.js';
import { aiLimiter, uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.post('/transcribe', uploadLimiter, uploadAudio.single('audio'), transcribeVoice);
router.post('/evaluate', aiLimiter, uploadAudio.single('audio'), validate(voiceEvaluateSchema), evaluateVoice);

export default router;
