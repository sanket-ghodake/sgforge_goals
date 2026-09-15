/**
 * @forge-apps/goals - Tier 3 Security: Zero-Trust Auth Guard & RBAC Verification
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 */

import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { createInternalServiceToken } from '../../src/lib/sdk';
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

  it('Arrange, Act, Assert: allows authorized employees with signed session token', async () => {
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/employee'], 'usr_template_tester');

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

  it('Arrange, Act, Assert: returns 403 when user lacks required role', async () => {
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/external_guest'], 'usr_unauthorized');

    try {
      const res = await fetch(`http://localhost:${server.port}/`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      expect(res.status).toBe(403);
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
});
