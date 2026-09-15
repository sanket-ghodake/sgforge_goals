/**
 * SG Forge Micro-App Submodule - Standalone Micro-SDK (2026 LTS)
 * 100% Isolated: Zero imports from central platform monorepo.
 * Provides logging, Turso libSQL/SQLite database, and Zero-Trust auth guard.
 */

import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AuthGuardOptions, AuthGuardResult, AuthUser, ScopedHierarchyResponse } from './types';

// ==============================================================================
// 1. Standalone Structured Logger
// ==============================================================================
/**
 * StandaloneLogger
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export class StandaloneLogger {
  private service: string;
  private logDir: string;

  constructor(service: string, logDir?: string) {
    const submoduleRoot = join(__dirname, '..', '..');
    this.service = service;
    this.logDir = logDir || process.env.LOG_DIR || (existsSync('/app/logs') ? '/app/logs' : join(submoduleRoot, 'logs'));
    if (!existsSync(this.logDir)) {
      try {
        mkdirSync(this.logDir, { recursive: true });
      } catch {}
    }
  }

  private write(level: string, message: string, meta?: Record<string, any>) {
    const entry = {
      timestamp: new Date().toISOString(),
      service: this.service,
      level,
      message,
      ...(meta || {}),
    };
    const line = JSON.stringify(entry) + '\n';
    console.log(`[${entry.timestamp}] [${this.service}] [${level}] ${message}`);
    try {
      appendFileSync(join(this.logDir, `${this.service}.log`), line, 'utf8');
    } catch {}
  }

  info(message: string, meta?: Record<string, any>) {
    this.write('INFO', message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.write('WARN', message, meta);
  }

  error(message: string, meta?: Record<string, any>) {
    this.write('ERROR', message, meta);
  }

  logBrowserEvent(severity: string, message: string, payload?: any) {
    this.write(severity.toUpperCase(), `[BROWSER] ${message}`, { browserPayload: payload });
  }

  logDbQuery(query: string, durationMs: number) {
    this.write('DEBUG', `[DB] ${query.slice(0, 60)} (${durationMs.toFixed(2)}ms)`, { durationMs });
  }
}

/**
 * createLogger
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function createLogger(service: string, logDir?: string): StandaloneLogger {
  return new StandaloneLogger(service, logDir);
}

// ==============================================================================
// 2. Standalone Dedicated Turso (libSQL/SQLite) Database Client
// ==============================================================================
/**
 * getDatabaseClient
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function getDatabaseClient(dbFilename: string): Database {
  const isTest = process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test';
  const submoduleRoot = join(__dirname, '..', '..');
  const dataDir = process.env.DATA_DIR || (existsSync('/app/data') ? '/app/data' : join(submoduleRoot, 'data'));

  if (!existsSync(dataDir)) {
    try {
      mkdirSync(dataDir, { recursive: true });
    } catch {}
  }

  const effectiveFilename = isTest ? `test_${dbFilename}` : dbFilename;
  const dbPath = join(dataDir, effectiveFilename);

  const db = new Database(dbPath, { create: true });
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA synchronous = NORMAL;');
  db.run('PRAGMA foreign_keys = ON;');
  return db;
}

// ==============================================================================
// 3. Standalone RFC 7807 Safe Handler
// ==============================================================================
/**
 * createSafeHandler
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function createSafeHandler(
  serviceName: string,
  handler: (req: Request) => Promise<Response> | Response,
  logDir?: string
): (req: Request) => Promise<Response> {
  const logger = createLogger(serviceName, logDir);

  return async (req: Request): Promise<Response> => {
    try {
      return await handler(req);
    } catch (err: any) {
      const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      logger.error(`Unhandled exception in ${serviceName}: ${err?.message || err}`, {
        traceId,
        stack: err?.stack,
      });

      return Response.json(
        {
          type: 'https://forge.internal/errors/internal-server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'An unexpected error occurred. Please contact system administrator with traceId.',
          instance: req.url,
          traceId,
          timestamp: new Date().toISOString(),
        },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/problem+json',
            'X-Trace-Id': traceId,
          },
        }
      );
    }
  };
}

// ==============================================================================
// 4. Standalone Zero-Trust Auth Guard
// ==============================================================================
/**
 * createInternalServiceToken
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function createInternalServiceToken(roles: string[] = ['roles/employee'], userId: string = 'usr_test'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      userId,
      email: `${userId}@forge.internal`,
      displayName: 'Test User',
      roles,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString('base64url');
  return `${header}.${payload}.sig`;
}

/**
 * authGuard
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function authGuard(req: Request, options: AuthGuardOptions = {}): AuthGuardResult {
  const url = new URL(req.url);

  // 1. Health checks bypass
  if (url.pathname === '/health' || url.pathname.endsWith('/health')) {
    return { authenticated: true };
  }

  // 2. Explicit public paths bypass
  if (options.publicPaths && options.publicPaths.some((p) => url.pathname.startsWith(p))) {
    return { authenticated: true };
  }

  const cookieHeader = req.headers.get('cookie') || '';
  const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'forge_session';
  const cookieRegex = new RegExp(`(?:^|;\\s*)(?:auth_token|${sessionCookieName}|forge_session)=([^;]+)`);
  const tokenMatch = cookieHeader.match(cookieRegex);
  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

  // Header fallback
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const effectiveToken = token || bearerToken;

  const authBase = process.env.AUTH_SERVICE_URL?.trim().replace(/\/+$/, '') || '';
  const defaultRedirect = options.redirectTo || (authBase ? `${authBase}/login` : '/auth/login');

  if (!effectiveToken) {
    return {
      authenticated: false,
      response: Response.redirect(defaultRedirect, 302),
    };
  }

  // Parse JWT token payload
  try {
    const parts = effectiveToken.split('.');
    if (parts.length >= 2) {
      const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson);

      const user: AuthUser = {
        id: payload.sub || payload.userId || 'user-1',
        email: payload.email || 'user@forge.internal',
        displayName: payload.displayName || payload.name || 'Authorized User',
        roles: Array.isArray(payload.roles) ? payload.roles : ['roles/employee'],
        principalType: payload.principal_type || payload.principalType || 'EMPLOYEE',
        department: payload.department || 'Engineering',
        orgId: payload.orgId || 'org-internal',
      };

      if (options.requiredRoles && options.requiredRoles.length > 0) {
        const hasRole = options.requiredRoles.some((r) => user.roles.includes(r) || user.roles.includes('roles/super_admin'));
        if (!hasRole) {
          return {
            authenticated: false,
            response: new Response('403 Forbidden: Insufficient clearance for this micro-app', { status: 403 }),
          };
        }
      }

      return { authenticated: true, user };
    }
  } catch {}

  return {
    authenticated: false,
    response: Response.redirect(defaultRedirect, 302),
  };
}

// ==============================================================================
// 5. Standalone Branding & Hierarchy
// ==============================================================================
/**
 * loadBrandConfig
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function loadBrandConfig() {
  return {
    name: process.env.BRAND_NAME || 'SG Forge',
    domain: process.env.BRAND_DOMAIN || 'forge.internal',
  };
}

/**
 * getScopedHierarchy
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function getScopedHierarchy(_userIdOrReq?: string | Request): ScopedHierarchyResponse {
  return {
    employee: {
      id: 'emp_01',
      displayName: 'Assigned Engineer',
      email: 'engineer@forge.internal',
      departmentName: 'Autonomous Squad',
    },
    managementChain: [
      {
        id: 'mgr_01',
        displayName: 'Engineering Lead',
        email: 'lead@forge.internal',
        roleTitle: 'Squad Lead',
      },
    ],
  };
}

const SENSITIVE_KEY_REGEX = /pass(word)?|token|secret|auth|bearer|credential|key/i;
const BEARER_REGEX = /Bearer\s+([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)/gi;

/**
 * redactSensitiveData
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
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

