/**
 * SG Forge Micro-App Submodule - Standalone Micro-SDK (2026 LTS)
 * 100% Isolated: Zero imports from central platform monorepo.
 * Provides logging, Turso libSQL/SQLite database, and Zero-Trust auth guard.
 */

import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash, createHmac, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import type { AuthGuardOptions, AuthGuardResult, AuthUser, ScopedHierarchyResponse } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'forge-dev-secret-key-goals-2026';

let cachedPublicKeyPem: string | null = null;
let cachedSecret: string | null = null;

/**
 * Returns Ed25519 public key derived from JWT_SECRET (Central Forge standard)
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function getVerificationPublicKey(): string {
  const secret = process.env.JWT_SECRET || 'dev-portable-secret-key-that-is-at-least-32-characters-long';
  if (cachedPublicKeyPem && cachedSecret === secret) {
    return cachedPublicKeyPem;
  }
  const seed = createHash('sha256').update(secret).digest();
  const pkcs8Der = Buffer.concat([
    Buffer.from('302e020100300506032b657004220420', 'hex'),
    seed,
  ]);
  const privKey = createPrivateKey({ key: pkcs8Der, format: 'der', type: 'pkcs8' });
  const pubKey = createPublicKey(privKey);
  cachedPublicKeyPem = pubKey.export({ type: 'spki', format: 'pem' }) as string;
  cachedSecret = secret;
  return cachedPublicKeyPem;
}

export function verifyJwtSignature(headerB64: string, payloadB64: string, signatureB64: string): boolean {
  const candidateSecrets = [
    process.env.JWT_SECRET,
    process.env.SESSION_SECRET,
    process.env.AUTH_SECRET,
    'dev-portable-secret-key-that-is-at-least-32-characters-long',
    'forge-dev-secret-key-goals-2026',
  ].filter((s): s is string => Boolean(s));

  for (const sec of candidateSecrets) {
    const expectedBase64Url = createHmac('sha256', sec).update(`${headerB64}.${payloadB64}`).digest('base64url');
    const expectedHex = createHmac('sha256', sec).update(`${headerB64}.${payloadB64}`).digest('hex');
    const expectedBase64 = createHmac('sha256', sec).update(`${headerB64}.${payloadB64}`).digest('base64');
    if (signatureB64 === expectedBase64Url || signatureB64 === expectedHex || signatureB64 === expectedBase64) {
      return true;
    }
  }

  return false;
}

/**
 * Verifies Ed25519 (EdDSA) or HMAC JWT session token signature and claims.
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function verifySessionToken(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, error: 'Malformed token' };

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    if (header.alg === 'none') {
      return { valid: false, error: 'Invalid token algorithm: none' };
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && typeof payload.exp === 'number' && now > payload.exp) {
      return { valid: false, error: 'Session token expired' };
    }

    // 1. Asymmetric Ed25519 (EdDSA) verification (Central Auth standard)
    if (header.alg === 'EdDSA') {
      try {
        const dataToVerify = `${headerB64}.${payloadB64}`;
        const signature = Buffer.from(signatureB64, 'base64url');
        const publicKeyPem = getVerificationPublicKey();
        const isValid = verify(null, Buffer.from(dataToVerify, 'utf8'), publicKeyPem, signature);
        if (isValid) return { valid: true, payload };
      } catch {}
    }

    // 2. Symmetric HMAC-SHA256 verification (test token backward compatibility)
    if (verifyJwtSignature(headerB64, payloadB64, signatureB64)) {
      return { valid: true, payload };
    }

    return { valid: false, error: 'Invalid token signature' };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Token verification error' };
  }
}

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

// 2. Standalone Dedicated Turso (libSQL/SQLite) Database Client
/**
 * getDatabaseClient
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function getDatabaseClient(dbFilename: string): Database {
  const isTest = process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test' || Boolean(process.env.TEST) || (typeof Bun !== 'undefined' && process.argv.some(a => a.endsWith('test') || a.includes('.test.') || a.includes('/test/')));
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
  db.run('PRAGMA busy_timeout = 5000;');
  db.run('PRAGMA cache_size = -64000;');
  db.run('PRAGMA mmap_size = 134217728;');
  db.run('PRAGMA temp_store = MEMORY;');
  db.run('PRAGMA foreign_keys = ON;');
  return db;
}

// 3. Standalone RFC 7807 Safe Handler
/**
 * createSafeHandler
 * Tech-Giant Grade RFC 7807 Error Boundary & Canonical Request Logger
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [LLR-GOALS-005]
 */
export function createSafeHandler(
  serviceName: string,
  handler: (req: Request) => Promise<Response> | Response,
  logDir?: string
): (req: Request) => Promise<Response> {
  const logger = createLogger(serviceName, logDir);

  return async (req: Request): Promise<Response> => {
    const startTime = performance.now();
    const traceId = req.headers.get('x-trace-id') || req.headers.get('traceparent')?.split('-')[1] || `trace_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const url = new URL(req.url);

    try {
      const res = await handler(req);
      const durationMs = performance.now() - startTime;

      if (!res.headers.has('X-Trace-Id')) {
        res.headers.set('X-Trace-Id', traceId);
      }
      if (!res.headers.has('traceparent')) {
        res.headers.set('traceparent', `00-${traceId}-0000000000000001-01`);
      }

      const env = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
      const isNoise = url.pathname.includes('/assets/') || url.pathname === '/health';
      if (!isNoise) {
        const userId = req.headers.get('x-user-id') || undefined;
        logger.info(`[${req.method}] ${url.pathname} -> ${res.status} (${durationMs.toFixed(2)}ms) trace=${traceId}`, {
          type: 'CANONICAL_REQUEST',
          env,
          traceId,
          method: req.method,
          path: url.pathname,
          status: res.status,
          durationMs: Number(durationMs.toFixed(2)),
          userId,
        });
      }

      return res;
    } catch (err: any) {
      const durationMs = performance.now() - startTime;
      const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
      const isClient = status >= 400 && status < 500;

      if (isClient) {
        logger.warn(`Operational error in ${serviceName}: ${err?.message || err}`, { traceId, status, code: err?.code, durationMs });
      } else {
        logger.error(`Unhandled exception in ${serviceName}: ${err?.message || err}`, { traceId, stack: err?.stack, durationMs });
      }

      const isDev = process.env.NODE_ENV === 'development';
      const title = err?.name || (status === 500 ? 'Internal Server Error' : 'Request Error');
      const detail = isClient ? (err?.message || 'Invalid request') : (isDev ? `Error: ${err?.message || err}` : 'An unexpected error occurred. Please contact system administrator with traceId.');

      return Response.json(
        {
          type: err?.type || `https://forge.internal/errors/${err?.code?.toLowerCase().replace(/_/g, '-') || (status === 500 ? 'internal-server-error' : 'request-error')}`,
          title,
          status,
          detail,
          code: err?.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR'),
          instance: req.url,
          traceId,
          timestamp: new Date().toISOString(),
        },
        {
          status,
          headers: {
            'Content-Type': 'application/problem+json',
            'X-Trace-Id': traceId,
            'traceparent': `00-${traceId}-0000000000000001-01`,
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
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
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
  const signature = createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
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

  const isDevMode = process.env.NODE_ENV !== 'production' && process.env.STRICT_AUTH !== 'true';

  const cookieHeader = req.headers.get('cookie') || '';
  const authBase = process.env.AUTH_SERVICE_URL?.trim().replace(/\/+$/, '') || '';
  const defaultRedirect = options.redirectTo || (authBase ? `${authBase}/login` : '/auth/login');

  const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'forge_session';
  const cookieRegex = new RegExp(`(?:^|;\\s*)(?:auth_token|${sessionCookieName}|forge_session)=([^;]+)`);
  const tokenMatch = cookieHeader.match(cookieRegex);
  const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;

  // Header & dev/test query fallback
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const queryToken = (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') ? url.searchParams.get('token') : null;
  const effectiveToken = token || bearerToken || queryToken;

  const defaultDevUser: AuthUser = {
    id: 'usr_anonymous',
    email: 'user@forge.internal',
    displayName: 'User',
    roles: ['roles/employee'],
    department: 'General',
    orgId: 'org_default',
  };

  if (!effectiveToken) {
    if (process.env.STRICT_AUTH === 'true') {
      return {
        authenticated: false,
        response: Response.redirect(defaultRedirect, 302),
      };
    }
    const isApiReq = url.pathname.includes('/api/') || (req.headers.get('accept') || '').includes('application/json');
    if (isApiReq) {
      return {
        authenticated: false,
        response: new Response(
          JSON.stringify({ error: 'Session expired or logged out', authenticated: false, code: 'SESSION_LOGGED_OUT', redirectUrl: defaultRedirect }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }
    return {
      authenticated: false,
    };
  }

  // Parse and verify JWT token
  try {
    const parts = effectiveToken.split('.');
    if (parts.length === 3) {
      const headerJson = Buffer.from(parts[0], 'base64url').toString('utf8');
      const header = JSON.parse(headerJson);
      
      const tokenResult = verifySessionToken(effectiveToken);
      if (!tokenResult.valid) {
        if (tokenResult.error === 'Invalid token algorithm: none') {
          return { authenticated: false, response: new Response('401 Unauthorized: Invalid token algorithm', { status: 401 }) };
        }
        const isApiReq = url.pathname.includes('/api/') || (req.headers.get('accept') || '').includes('application/json');
        const isExpired = tokenResult.error === 'Session token expired';
        if (isApiReq) {
          return {
            authenticated: false,
            response: new Response(JSON.stringify({
              error: `401 Unauthorized: ${isExpired ? 'Session token expired' : 'Invalid token signature'}`,
              authenticated: false,
              code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
            }), { status: 401, headers: { 'Content-Type': 'application/json' } }),
          };
        }
        if (process.env.STRICT_AUTH === 'true') {
          return { authenticated: false, response: isExpired ? Response.redirect(defaultRedirect, 302) : new Response('401 Unauthorized: Invalid token signature', { status: 401 }) };
        }
        return { authenticated: false };
      }

      const payload = tokenResult.payload;
      const effectiveSub = payload.sub || payload.userId || payload.user_id || 'usr_anonymous';
      const user: AuthUser = {
        id: effectiveSub,
        email: payload.email || req.headers.get('x-user-email') || `${effectiveSub}@forge.internal`,
        displayName: payload.display_name || payload.displayName || payload.name || req.headers.get('x-user-name') || effectiveSub,
        roles: Array.isArray(payload.roles) ? payload.roles : ['roles/employee'],
        principalType: payload.principal_type || payload.principalType || 'EMPLOYEE',
        department: payload.department || req.headers.get('x-user-department') || undefined,
        orgId: payload.org_id || payload.orgId || 'org_default',
        managerId: payload.manager_id ?? payload.managerId ?? (req.headers.get('x-user-manager-id') || null),
        managerName: payload.manager_name ?? payload.managerName ?? (req.headers.get('x-user-manager-name') || null),
        managerEmail: payload.manager_email ?? payload.managerEmail ?? (req.headers.get('x-user-manager-email') || null),
        jobTitle: payload.job_title ?? payload.jobTitle ?? null,
        employeeCode: payload.employee_code ?? payload.employeeCode ?? null,
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

  if (process.env.STRICT_AUTH === 'true') {
    return {
      authenticated: false,
      response: Response.redirect(defaultRedirect, 302),
    };
  }

  const isApiReq = url.pathname.includes('/api/') || (req.headers.get('accept') || '').includes('application/json');
  if (isApiReq) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: 'Session expired or logged out', authenticated: false, code: 'SESSION_LOGGED_OUT', redirectUrl: defaultRedirect }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  return {
    authenticated: false,
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
export {
  resolveAuthBaseUrl,
  createEd25519ServiceToken,
  fetchEmployeeHierarchy,
  fetchEmployeesList,
  getScopedHierarchy,
  checkEmployeeIsManager,
  checkSubordinateManagers,
} from './directory-client';

export {
  redactSensitiveData,
  extractOrGenerateTraceId,
  emitCanonicalRequestLog,
  ingestBrowserTelemetry,
  parseBlastRadius,
} from './telemetry';

