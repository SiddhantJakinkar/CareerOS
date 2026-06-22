import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

export type AuditSeverity = 'info' | 'warn' | 'critical';

export async function auditLog(opts: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  severity?: AuditSeverity;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const entry = {
    userId: opts.userId,
    action: opts.action,
    resource: opts.resource,
    resourceId: opts.resourceId,
    severity: opts.severity ?? 'info',
    ip: opts.ip,
    userAgent: opts.userAgent,
    metadata: opts.metadata,
  };

  try {
    await AuditLog.create(entry);
  } catch (error) {
    logger.warn('Audit log write failed', { error, entry });
  }

  if (opts.severity === 'critical' || opts.severity === 'warn') {
    logger.warn(`[AUDIT] ${opts.action}`, entry);
  }
}

export function auditFromRequest(
  req: { user?: { userId: string }; ip?: string; get?: (h: string) => string | undefined },
  opts: Omit<Parameters<typeof auditLog>[0], 'userId' | 'ip' | 'userAgent'>
): Promise<void> {
  return auditLog({
    ...opts,
    userId: req.user?.userId,
    ip: req.ip,
    userAgent: req.get?.('user-agent'),
  });
}
