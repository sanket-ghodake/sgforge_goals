/**
 * @forge-apps/goals - Tier 3 Security: Zero-Trust Auth Guard & RBAC Verification
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 */

import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { createInternalServiceToken, createEd25519ServiceToken } from '../../src/lib/sdk';
import { startgoalsServer } from '../../src/server';

describe('Tier 3 Security: Individual Goal Center Zero-Trust Auth Gate', () => {
  beforeAll(() => {
    process.env.STRICT_AUTH = 'true';
  });
  afterAll(() => {
    delete process.env.STRICT_AUTH;
  });
  it('Arrange, Act, Assert: blocks unauthenticated requests with 302 redirect to /auth/login', async () => {
    const server = startgoalsServer(0);

    try {
      const res = await fetch(`http://localhost:${server.port}/`, { redirect: 'manual' });
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toContain('/auth/login');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: allows authorized managers with signed session token', async () => {
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager'], 'usr_template_tester');

    try {
      const res = await fetch(`http://localhost:${server.port}/`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('Individual Goal Center');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: returns 403 Leadership Clearance screen when individual contributor lacks manager role', async () => {
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/employee'], 'usr_ic_employee');

    try {
      const res = await fetch(`http://localhost:${server.port}/`, {
        headers: { Cookie: `forge_session=${token}`, Accept: 'text/html' },
      });
      expect(res.status).toBe(403);
      const html = await res.text();
      expect(html).toContain('Leadership Clearance Required');
      expect(html).toContain('Manager Access Only');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: returns 403 RFC 7807 JSON when unprivileged user calls API', async () => {
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/employee'], 'usr_ic_employee');

    try {
      const res = await fetch(`http://localhost:${server.port}/api/boards`, {
        headers: { Cookie: `forge_session=${token}`, Accept: 'application/json' },
      });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.code).toBe('FORBIDDEN_MANAGER_ONLY');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: rejects tokens with alg: none', async () => {
    const server = startgoalsServer(0);
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'usr_test', roles: ['roles/employee'] })).toString('base64url');
    const noneToken = `${header}.${payload}.sig`;

    try {
      const res = await fetch(`http://localhost:${server.port}/`, {
        headers: { Cookie: `forge_session=${noneToken}` },
      });
      expect(res.status).toBe(401);
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: rejects tokens with invalid or tampered signature', async () => {
    const server = startgoalsServer(0);
    const validToken = createInternalServiceToken(['roles/employee'], 'usr_tester');
    const tamperedToken = validToken.slice(0, -5) + 'fake1';

    try {
      const res = await fetch(`http://localhost:${server.port}/`, {
        headers: { Cookie: `forge_session=${tamperedToken}` },
      });
      expect(res.status).toBe(401);
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: parses snake_case display_name and department claims from JWT', async () => {
    const server = startgoalsServer(0);
    const JWT_SECRET = process.env.JWT_SECRET || 'forge-dev-secret-key-goals-2026';
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: 'usr_custom_mgr',
        email: 'custom.mgr@forge.internal',
        display_name: 'Custom Manager Name',
        department: 'Cloud Infrastructure',
        roles: ['roles/manager'],
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString('base64url');
    const signature = require('node:crypto').createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
    const token = `${header}.${payload}.${signature}`;

    try {
      const res = await fetch(`http://localhost:${server.port}/`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('Custom Manager Name');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: returns 401 for expired token on API endpoints', async () => {
    const server = startgoalsServer(0);
    const JWT_SECRET = process.env.JWT_SECRET || 'forge-dev-secret-key-goals-2026';
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: 'usr_expired',
        email: 'expired@forge.internal',
        display_name: 'Expired User',
        roles: ['roles/manager'],
        exp: Math.floor(Date.now() / 1000) - 600, // Expired 10 minutes ago
      })
    ).toString('base64url');
    const signature = require('node:crypto').createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
    const token = `${header}.${payload}.${signature}`;

    try {
      const res = await fetch(`http://localhost:${server.port}/api/boards`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.authenticated).toBe(false);
      expect(data.code).toBe('TOKEN_EXPIRED');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: authenticates employee with asymmetric Ed25519 token matching Central Auth', async () => {
    const server = startgoalsServer(0);
    const edToken = createEd25519ServiceToken(['roles/manager'], 'usr_ed25519_mgr');

    try {
      const res = await fetch(`http://localhost:${server.port}/api/auth/me`, {
        headers: { Cookie: `forge_session=${edToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.user.id).toBe('usr_ed25519_mgr');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: renders session logged out screen with login button and redirect when unauthenticated in browser mode', async () => {
    delete process.env.STRICT_AUTH;
    const server = startgoalsServer(0);

    try {
      const res = await fetch(`http://localhost:${server.port}/`, {
        headers: { Accept: 'text/html' },
      });
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('Session Expired');
      expect(html).toContain('Log In Again');
      expect(html).toContain('/auth/login');
      expect(html).toContain('Redirecting to Central Authentication');
    } finally {
      process.env.STRICT_AUTH = 'true';
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: rejects renewal attempts with malformed or truncated refresh tokens', async () => {
    const server = startgoalsServer(0);

    try {
      const res = await fetch(`http://localhost:${server.port}/api/auth/refresh`, {
        method: 'POST',
        headers: { Cookie: 'forge_refresh_token=bad' }, // less than 8 chars
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.code).toBe('REFRESH_TOKEN_INVALID');
    } finally {
      server.stop(true);
    }
  });
});
