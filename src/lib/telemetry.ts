/**
 * SG Forge Micro-App Submodule - Observability & Telemetry Engine (2026 LTS)
 * 100% Isolated: Zero imports from central monorepo.
 * Provides Canonical Request Logging, Distributed Tracing, Blast Radius Analysis,
 * and Dev vs Prod Observability Controls.
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [LLR-GOALS-005]
 */

const SENSITIVE_KEY_REGEX = /pass(word)?|token|secret|auth|bearer|credential|key/i;
const BEARER_REGEX = /Bearer\s+([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)/gi;

/**
 * Recursively redacts sensitive keys, tokens, and PII from objects and strings.
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [LLR-GOALS-005]
 */
export function redactSensitiveData(data: unknown, depth = 0): unknown {
  if (depth > 6 || data === null || data === undefined) return data;
  if (typeof data === 'string') return data.replace(BEARER_REGEX, 'Bearer [REDACTED]');
  if (Array.isArray(data)) return data.map((item) => redactSensitiveData(item, depth + 1));
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = redactSensitiveData(val, depth + 1);
      } else if (typeof val === 'string') {
        sanitized[key] = val.replace(BEARER_REGEX, 'Bearer [REDACTED]');
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }
  return data;
}

export interface CanonicalLogEvent {
  timestamp: string;
  service: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  type: 'CANONICAL_REQUEST';
  env: 'development' | 'production' | 'test';
  traceId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  userId?: string;
  orgId?: string;
  clientIp?: string;
  userAgent?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface BrowserTelemetryPayload {
  eventType: 'error' | 'unhandledrejection' | 'click' | 'route_change' | 'custom';
  message: string;
  traceId?: string;
  userId?: string;
  timestamp?: string;
  url?: string;
  stack?: string;
  breadcrumbs?: Array<{
    type: string;
    target?: string;
    timestamp: number;
    details?: Record<string, unknown>;
  }>;
  meta?: Record<string, unknown>;
}

export interface BlastRadiusReport {
  window: string;
  environment: string;
  totalRequests: number;
  totalUniqueUsers: number;
  smoothJourneysCount: number;
  smoothJourneysPercent: number;
  impactedJourneysCount: number;
  impactedUsers: Array<{
    userId: string;
    errorCount: number;
    lastError: string;
    errorCode: string;
    affectedRoutes: string[];
    traceIds: string[];
  }>;
  errorBreakdown: Record<string, number>;
  statusBreakdown: Record<number, number>;
  sloMet: boolean;
}

/**
 * Extracts incoming trace ID from headers or generates a W3C-compatible trace ID.
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [LLR-GOALS-005]
 */
export function extractOrGenerateTraceId(req: Request): string {
  const directTrace = req.headers.get('x-trace-id');
  if (directTrace && directTrace.trim().length > 0) {
    return directTrace.trim();
  }

  const traceparent = req.headers.get('traceparent');
  if (traceparent) {
    const parts = traceparent.split('-');
    if (parts.length >= 2 && parts[1]) {
      return parts[1].trim();
    }
  }

  const entropy = Math.random().toString(36).slice(2, 8);
  return `trace_${Date.now()}_${entropy}`;
}

/**
 * Formats and records a wide canonical access event for any completed HTTP request.
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [LLR-GOALS-005]
 */
export function emitCanonicalRequestLog(
  logger: { info: (msg: string, meta?: Record<string, unknown>) => void; warn: (msg: string, meta?: Record<string, unknown>) => void; error: (msg: string, meta?: Record<string, unknown>) => void },
  event: Omit<CanonicalLogEvent, 'timestamp' | 'service' | 'type' | 'level'>,
  serviceName = 'goals'
): void {
  const status = typeof event.status === 'number' ? event.status : 200;
  const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';

  const cleanEvent: Record<string, unknown> = {
    type: 'CANONICAL_REQUEST',
    service: serviceName,
    ...(redactSensitiveData(event as unknown) as Record<string, unknown>),
  };

  const summary = `[${cleanEvent.method}] ${cleanEvent.path} -> ${status} (${Number(cleanEvent.durationMs).toFixed(2)}ms) trace=${cleanEvent.traceId}${cleanEvent.userId ? ` user=${cleanEvent.userId}` : ''}`;

  if (level === 'ERROR') {
    logger.error(summary, cleanEvent);
  } else if (level === 'WARN') {
    logger.warn(summary, cleanEvent);
  } else {
    logger.info(summary, cleanEvent);
  }
}

/**
 * Processes and ingests browser crash and telemetry events.
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [LLR-GOALS-005]
 */
export function ingestBrowserTelemetry(
  logger: { logBrowserEvent: (severity: string, message: string, payload?: unknown) => void },
  payload: BrowserTelemetryPayload,
  req: Request
): void {
  const sanitized = redactSensitiveData(payload as unknown) as BrowserTelemetryPayload;
  const severity = sanitized.eventType === 'error' || sanitized.eventType === 'unhandledrejection' ? 'ERROR' : 'INFO';
  const traceId = sanitized.traceId || extractOrGenerateTraceId(req);

  logger.logBrowserEvent(severity, `${sanitized.eventType.toUpperCase()}: ${sanitized.message || 'Client telemetry event'}`, {
    ...sanitized,
    traceId,
    clientIp: req.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: req.headers.get('user-agent') || 'Unknown',
  });
}

/**
 * Parses raw JSON log entries from disk and calculates Blast Radius / User Impact metrics.
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [LLR-GOALS-005]
 */
export function parseBlastRadius(
  logContent: string,
  options: {
    envFilter?: 'development' | 'production' | 'test' | 'all';
    windowMs?: number;
    nowMs?: number;
  } = {}
): BlastRadiusReport {
  const now = options.nowMs || Date.now();
  const windowMs = options.windowMs || 3600 * 1000;
  const envFilter = options.envFilter || 'all';

  const lines = logContent.split('\n').filter((l) => l.trim().length > 0);

  let totalRequests = 0;
  const allUsers = new Set<string>();
  const userOutcomes = new Map<string, {
    successCount: number;
    errorCount: number;
    lastError: string;
    errorCode: string;
    affectedRoutes: Set<string>;
    traceIds: Set<string>;
  }>();

  const errorBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<number, number> = {};

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const entryTime = new Date(entry.timestamp || 0).getTime();

      if (windowMs > 0 && (now - entryTime) > windowMs) {
        continue;
      }

      if (envFilter !== 'all' && entry.env && entry.env !== envFilter) {
        continue;
      }

      if (entry.status && typeof entry.status === 'number') {
        totalRequests++;
        statusBreakdown[entry.status] = (statusBreakdown[entry.status] || 0) + 1;

        const userId = (entry.userId as string) || (entry.user as string) || 'anonymous';
        allUsers.add(userId);

        let userRecord = userOutcomes.get(userId);
        if (!userRecord) {
          userRecord = {
            successCount: 0,
            errorCount: 0,
            lastError: '',
            errorCode: '',
            affectedRoutes: new Set<string>(),
            traceIds: new Set<string>(),
          };
          userOutcomes.set(userId, userRecord);
        }

        const isFailure = entry.status >= 400;
        if (isFailure) {
          userRecord.errorCount++;
          const code = (entry.errorCode as string) || (entry.code as string) || `HTTP_${entry.status}`;
          userRecord.errorCode = code;
          userRecord.lastError = (entry.errorMessage as string) || (entry.message as string) || `Status ${entry.status}`;
          if (entry.path) userRecord.affectedRoutes.add(String(entry.path));
          if (entry.traceId) userRecord.traceIds.add(String(entry.traceId));
          errorBreakdown[code] = (errorBreakdown[code] || 0) + 1;
        } else {
          userRecord.successCount++;
        }
      }
    } catch {
      // Ignore non-json or corrupt lines
    }
  }

  const impactedUsers: BlastRadiusReport['impactedUsers'] = [];
  let smoothJourneysCount = 0;

  for (const [userId, record] of userOutcomes.entries()) {
    if (record.errorCount > 0) {
      impactedUsers.push({
        userId,
        errorCount: record.errorCount,
        lastError: record.lastError,
        errorCode: record.errorCode,
        affectedRoutes: Array.from(record.affectedRoutes),
        traceIds: Array.from(record.traceIds).slice(0, 5),
      });
    } else if (record.successCount > 0) {
      smoothJourneysCount++;
    }
  }

  const totalUniqueUsers = allUsers.size;
  const smoothJourneysPercent = totalRequests > 0
    ? Number((((totalRequests - Object.entries(statusBreakdown).reduce((sum, [code, count]) => Number(code) >= 500 ? sum + count : sum, 0)) / totalRequests) * 100).toFixed(2))
    : 100;

  const fiveXxCount = Object.entries(statusBreakdown).reduce((sum, [code, count]) => Number(code) >= 500 ? sum + count : sum, 0);
  const sloMet = totalRequests === 0 || ((totalRequests - fiveXxCount) / totalRequests) >= 0.999;

  return {
    window: `${Math.round(windowMs / 60000)} minutes`,
    environment: envFilter,
    totalRequests,
    totalUniqueUsers,
    smoothJourneysCount,
    smoothJourneysPercent,
    impactedJourneysCount: impactedUsers.length,
    impactedUsers,
    errorBreakdown,
    statusBreakdown,
    sloMet,
  };
}
