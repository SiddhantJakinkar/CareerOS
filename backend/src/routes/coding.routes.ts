import { Router } from 'express';
import { getTests, getTest, submitTest, getResults, submitTestSchema } from '../controllers/coding.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', getTests);
router.get('/results/all', authenticate, getResults);
router.get('/:id', getTest);
router.post('/submit', authenticate, validate(submitTestSchema), submitTest);

export default router;
