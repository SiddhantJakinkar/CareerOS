import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { startScheduler } from './scheduler/index.js';
import { logger } from './utils/logger.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(generalLimiter);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap(): Promise<void> {
  await connectDatabase();
  startScheduler();

  app.listen(Number(env.PORT), () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});

export default app;
