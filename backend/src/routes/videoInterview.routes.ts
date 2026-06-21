import { Router } from 'express';
import {
  uploadVideo,
  listVideos,
  getVideo,
  removeVideo,
} from '../controllers/videoInterview.controller.js';
import { authenticate } from '../middleware/auth.js';
import { uploadVideo as uploadMiddleware } from '../middleware/upload.js';
import { uploadLimiter, aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.get('/', listVideos);
router.get('/:id', getVideo);
router.post('/', uploadLimiter, aiLimiter, uploadMiddleware.single('video'), uploadVideo);
router.delete('/:id', removeVideo);

export default router;
