/**
 * SG Forge Micro-App Submodule - Central Directory & Org Hierarchy Client (2026 LTS)
 * 100% Autonomous: Communicates with Central Forge Auth Service via HTTP API.
 * Preserves dedicated Turso DB isolation by caching synced employee profiles locally.
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [HLR-GOALS-001]
 */

import { existsSync } from 'node:fs';
import { createHash, createPrivateKey, sign } from 'node:crypto';
import type { EmployeeManagerCheckResponse, ScopedHierarchyResponse } from './types';

/**
 * Resolves the base URL for Central Identity & Auth Service.
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function resolveAuthBaseUrl(customUrl?: string): string {
  if (customUrl) return customUrl.replace(/\/+$/, '');
  const isDocker = existsSync('/.dockerenv') || process.env.IS_DOCKER === 'true';
  const envUrl = process.env.AUTH_SERVICE_URL || process.env.FORGE_GATEWAY_URL;

  if (isDocker) {
    if (envUrl) {
      let clean = envUrl.replace(/\/+$/, '');
      if (clean.includes('localhost') || clean.includes('127.0.0.1')) {
        clean = clean.replace(/localhost(:\d+)?/, 'proxy:8080').replace(/127\.0\.0\.1(:\d+)?/, 'proxy:8080');
      }
      return clean.endsWith('/auth') ? clean : `${clean}/auth`;
    }
    return 'http://proxy:8080/auth';
  }

  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/auth') ? clean : `${clean}/auth`;
  }
  return 'http://localhost:8080/auth';
}

/**
 * Generates an asymmetric Ed25519 internal service token for inter-service communication.
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function createEd25519ServiceToken(
  roles: string[] = ['roles/super_admin'],
  sub: string = 'internal-service-goals'
): string {
  const secret = process.env.JWT_SECRET || 'dev-portable-secret-key-that-is-at-least-32-characters-long';
  const seed = createHash('sha256').update(secret).digest();
  const pkcs8Der = Buffer.concat([
    Buffer.from('302e020100300506032b657004220420', 'hex'),
    seed,
  ]);
  const privKey = createPrivateKey({ key: pkcs8Der, format: 'der', type: 'pkcs8' });
  const kid = `forge-key-${seed.subarray(0, 4).toString('hex')}`;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'EdDSA', typ: 'JWT', kid };
  const payload = {
    iss: 'https://forge.internal/auth',
    sub,
    email: `${sub}@forge.internal`,
    display_name: 'Goals Service Account',
    principal_type: 'SERVICE',
    org_id: 'org_default',
    roles,
    permissions: ['*'],
    iat: now,
    exp: now + 300,
  };
  const encHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${encHeader}.${encPayload}`;
  const sig = sign(null, Buffer.from(data), privKey).toString('base64url');
  return `${data}.${sig}`;
}

/**
 * Fetch employee hierarchy & management chain from Central Auth service.
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export async function fetchEmployeeHierarchy(
  userId: string,
  options: { baseUrl?: string; incomingReq?: Request } = {}
): Promise<{ user: any; managementChain: any[]; directReports: any[] } | null> {
  try {
    const base = resolveAuthBaseUrl(options.baseUrl);
    const target = `${base}/api/v1/auth/org/employees/${encodeURIComponent(userId)}`;
    
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Forge-Action': '1',
    };

    if (options.incomingReq) {
      const cookie = options.incomingReq.headers.get('cookie');
      const auth = options.incomingReq.headers.get('authorization');
      if (cookie) headers['Cookie'] = cookie;
      if (auth) headers['Authorization'] = auth;
    }

    if (!headers['Authorization'] && !headers['Cookie']) {
      try {
        headers['Authorization'] = `Bearer ${createEd25519ServiceToken()}`;
      } catch {}
    }

    const res = await fetch(target, {
      headers,
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;
    return (await res.json()) as any;
  } catch {
    return null;
  }
}

/**
 * List, search, and discover employees from Central Auth service.
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export async function fetchEmployeesList(
  params: { search?: string; departmentId?: string; limit?: number; baseUrl?: string; incomingReq?: Request } = {}
): Promise<{ items: any[]; total: number; departments: any[] } | null> {
  try {
    const base = resolveAuthBaseUrl(params.baseUrl);
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.departmentId) qs.set('departmentId', params.departmentId);
    if (params.limit) qs.set('limit', String(params.limit || 50));

    const target = `${base}/api/v1/auth/org/employees?${qs.toString()}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Forge-Action': '1',
    };

    if (params.incomingReq) {
      const cookie = params.incomingReq.headers.get('cookie');
      const auth = params.incomingReq.headers.get('authorization');
      if (cookie) headers['Cookie'] = cookie;
      if (auth) headers['Authorization'] = auth;
    }

    if (!headers['Authorization'] && !headers['Cookie']) {
      try {
        headers['Authorization'] = `Bearer ${createEd25519ServiceToken()}`;
      } catch {}
    }

    const res = await fetch(target, {
      headers,
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;
    return (await res.json()) as any;
  } catch {
    return null;
  }
}

/**
 * Scoped hierarchy resolver with Central Auth fallback.
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export async function getScopedHierarchy(userIdOrReq?: string | Request): Promise<ScopedHierarchyResponse> {
  const userId = typeof userIdOrReq === 'string' ? userIdOrReq : '';
  const req = typeof userIdOrReq === 'object' ? userIdOrReq : undefined;

  if (!userId && !req) {
    return {
      employee: {
        id: '',
        displayName: 'Unassigned',
        email: '',
        departmentName: 'Organization',
      },
      managementChain: [],
    };
  }

  const hierarchy = userId ? await fetchEmployeeHierarchy(userId, { incomingReq: req }) : null;
  const roster = await fetchEmployeesList({ search: userId || undefined, incomingReq: req });
  const matched = roster?.items?.find((i: any) => (userId && i.id === userId) || (hierarchy?.user?.email && i.email === hierarchy.user.email)) || roster?.items?.[0];

  if (hierarchy && hierarchy.user) {
    return {
      employee: {
        id: hierarchy.user.id,
        displayName: hierarchy.user.display_name,
        email: hierarchy.user.email,
        departmentName: matched?.department_name || hierarchy.user.department_name || 'Organization',
      },
      managementChain: (hierarchy.managementChain || []).map((m: any) => ({
        id: m.id,
        displayName: m.display_name,
        email: m.email,
        roleTitle: m.job_title || 'Manager',
      })),
    };
  }

  const effectiveId = userId || matched?.id || 'usr_current';
  const effectiveName = matched?.display_name || 'Employee';
  const effectiveEmail = matched?.email || `${effectiveId}@forge.internal`;

  return {
    employee: {
      id: effectiveId,
      displayName: effectiveName,
      email: effectiveEmail,
      departmentName: matched?.department_name || 'Organization',
    },
    managementChain: [],
  };
}

/**
 * Checks whether an employee is a manager with subordinate direct reports in SG Forge Central Hierarchy.
 * Calls dedicated SG Forge Central Auth endpoint: GET /api/v1/auth/hierarchy/:id/is-manager
 * @requirements [HLR-AUTH-102] [LLR-AUTH-012] [HLR-SDK-301]
 */
export async function checkEmployeeIsManager(
  userId: string,
  options: { baseUrl?: string; incomingReq?: Request } = {}
): Promise<EmployeeManagerCheckResponse | null> {
  if (!userId) return null;

  try {
    const base = resolveAuthBaseUrl(options.baseUrl);
    const target = `${base}/api/v1/auth/hierarchy/${encodeURIComponent(userId)}/is-manager`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Forge-Action': '1',
    };

    if (options.incomingReq) {
      const cookie = options.incomingReq.headers.get('cookie');
      const auth = options.incomingReq.headers.get('authorization');
      if (cookie) headers['Cookie'] = cookie;
      if (auth) headers['Authorization'] = auth;
    }

    if (!headers['Authorization'] && !headers['Cookie']) {
      try {
        headers['Authorization'] = `Bearer ${createEd25519ServiceToken()}`;
      } catch {}
    }

    const res = await fetch(target, {
      headers,
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return {
      status: data.status || 'SUCCESS',
      userId: data.userId || userId,
      isManager: Boolean(data.isManager),
      directReportsCount: Number(data.directReportsCount || 0),
    };
  } catch {
    return null;
  }
}

/**
 * Checks how many subordinate managers exist within a given list of direct report user IDs.
 * Queries SG Forge Central Auth endpoint: GET /api/v1/auth/hierarchy/:id/is-manager for each report.
 * @requirements [HLR-AUTH-102] [LLR-AUTH-012] [HLR-SDK-301]
 */
export async function checkSubordinateManagers(
  directReportIds: string[],
  options: { baseUrl?: string; incomingReq?: Request } = {}
): Promise<{ totalReports: number; subordinateManagersCount: number; managerIds: string[] }> {
  if (!Array.isArray(directReportIds) || directReportIds.length === 0) {
    return { totalReports: 0, subordinateManagersCount: 0, managerIds: [] };
  }

  const managerIds: string[] = [];
  for (const reportId of directReportIds) {
    if (!reportId) continue;
    const check = await checkEmployeeIsManager(reportId, options);
    if (check && check.isManager) {
      managerIds.push(reportId);
    }
  }

  return {
    totalReports: directReportIds.length,
    subordinateManagersCount: managerIds.length,
    managerIds,
  };
}

