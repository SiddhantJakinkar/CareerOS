import cron from 'node-cron';
import { fetchAllJobs, isJobSyncRunning } from '../jobs/jobFetcher.js';
import { logger } from '../utils/logger.js';

const SYNC_CRON = '*/30 * * * *';

export function startScheduler(): void {
  cron.schedule(SYNC_CRON, async () => {
    if (isJobSyncRunning()) {
      logger.warn('Skipping scheduled job sync — previous run still active');
      return;
    }
    logger.info('Starting scheduled job sync (every 30 minutes)');
    try {
      await fetchAllJobs();
    } catch (error) {
      logger.error('Scheduled job sync failed', { error });
    }
  });

  // Defer first sync so API routes (dashboard, etc.) respond immediately on startup
  setTimeout(() => {
    fetchAllJobs().catch((error) => {
      logger.error('Initial job sync failed', { error });
    });
  }, 15_000);

  logger.info('Scheduler started — job sync runs every 30 minutes');
}
