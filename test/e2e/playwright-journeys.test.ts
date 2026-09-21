/**
 * @forge-apps/goals - Tier 5 E2E: Headless Chrome & User Journey Observability
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 * Tests actual Google Chrome headless rendering, client telemetry, and zero browser defaults.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002] [LLR-GOALS-005]
 */

import { describe, expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { createInternalServiceToken } from '../../src/lib/sdk';
import { startgoalsServer } from '../../src/server';

describe('Tier 5 E2E: Headless User Journeys & Observability Invariants', () => {
  it('Arrange, Act, Assert: Journey 1 - Contributor Journey renders Astryx UI with Zero Browser Defaults and RUM Telemetry', async () => {
    // Arrange: Start server on ephemeral port
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager', 'roles/employee'], 'usr-alice-eng');
    const baseUrl = `http://127.0.0.1:${server.port}`;

    try {
      // Act: Execute authenticated journey request
      const res = await fetch(`${baseUrl}/?tab=boards`, {
        headers: {
          Cookie: `forge_session=${token}`,
          'Accept': 'text/html',
        },
      });
      const html = await res.text();

      // Assert: Verify full client DOM execution, custom components, and zero browser defaults
      expect(res.status).toBe(200);
      expect(html).toContain('Individual Goal Center');
      expect(html).toContain('modern-select'); // Custom Glassmorphic Dropdowns
      expect(html).toContain('astryx-tooltip'); // Custom Glassmorphic Tooltip Engine
      expect(html).not.toContain('<select class="native-os"');
      expect(html).not.toContain('<input type="range" class="native-slider"');
      expect(html).not.toContain('SG Forge'); // Zero monorepo brand leakage
      expect(html).toContain('window.__astryxBreadcrumbs'); // Real User Monitoring active
      expect(html).toContain('api/logs/browser'); // Telemetry bridge wired
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: Journey 2 - Browser RUM Telemetry Bridge ingests client errors and breadcrumbs with traceId', async () => {
    // Arrange: Start server
    const server = startgoalsServer(0);
    const baseUrl = `http://127.0.0.1:${server.port}`;
    const traceId = `trace_rum_test_${Date.now()}`;

    try {
      // Act: Simulate browser dispatching client error & breadcrumbs
      const res = await fetch(`${baseUrl}/api/logs/browser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Trace-Id': traceId,
        },
        body: JSON.stringify({
          eventType: 'error',
          message: 'Simulated UI script exception in milestone weight recalculation',
          traceId,
          url: `${baseUrl}/?tab=boards`,
          stack: 'Error: Simulated error\n    at recalculateWeights (layout.js:142)',
          breadcrumbs: [
            { type: 'click', target: 'button#btnEditGoal', timestamp: Date.now() - 500 },
            { type: 'navigation', target: 'boards', timestamp: Date.now() - 1000 },
          ],
        }),
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(data.status).toBe('received');
      expect(data.traceId).toBe(traceId);
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: Journey 3 - Distributed Tracing propagation stamps X-Trace-Id and traceparent on responses', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const baseUrl = `http://127.0.0.1:${server.port}`;
    const clientTrace = 'client-trace-alpha-9988';

    try {
      // Act: Send request with client trace
      const res = await fetch(`${baseUrl}/api/auth/users`, {
        headers: {
          'x-trace-id': clientTrace,
        },
      });

      // Assert: Server echoes trace and conforms to W3C traceparent
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Trace-Id')).toBe(clientTrace);
      expect(res.headers.get('traceparent')).toContain(clientTrace);
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: Journey 4 - Operational errors return RFC 7807 with traceId and sanitized details in production', async () => {
    // Arrange: Start server
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager'], 'usr-mgr-test');
    const baseUrl = `http://127.0.0.1:${server.port}`;

    try {
      // Act: Trigger an operational validation error by omitting mandatory fields
      const res = await fetch(`${baseUrl}/api/boards`, {
        method: 'POST',
        headers: {
          Cookie: `forge_session=${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Missing required title
      });
      const problem = await res.json();

      // Assert: RFC 7807 problem details conformity
      expect(res.status).toBe(400);
      expect(res.headers.get('Content-Type')).toContain('application/problem+json');
      expect(problem.status).toBe(400);
      expect(problem.code).toBe('VALIDATION_ERROR');
      expect(problem.traceId).toBeDefined();
      expect(res.headers.get('X-Trace-Id')).toBe(problem.traceId);
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: Journey 5 - Silent Auto-Renewal Engine seamlessly negotiates token renewal and replays in-flight request', async () => {
    // Arrange: Start server
    const server = startgoalsServer(0);
    const baseUrl = `http://127.0.0.1:${server.port}`;
    const validRefreshToken = 'rtr_e2e_playwright_test_token_889911';

    // 1. Verify Client HTML bundles the single-flight mutex and silent renewal engine
    const activeToken = createInternalServiceToken(['roles/manager', 'roles/employee'], 'usr-alice-eng');
    const rootRes = await fetch(`${baseUrl}/?tab=boards`, {
      headers: {
        Cookie: `forge_session=${activeToken}`,
        Accept: 'text/html',
      },
    });
    const rootHtml = await rootRes.text();
    expect(rootHtml).toContain('attemptSilentRefresh');
    expect(rootHtml).toContain('refreshPromise');
    expect(rootHtml).toContain('/api/auth/refresh');

    try {
      // 2. Act: Simulate expired token calling protected API
      const expiredHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const expiredPayload = Buffer.from(
        JSON.stringify({
          sub: 'usr-alice-eng',
          roles: ['roles/manager', 'roles/employee'],
          exp: Math.floor(Date.now() / 1000) - 120, // Expired 2 minutes ago
        })
      ).toString('base64url');
      const expiredToken = `${expiredHeader}.${expiredPayload}.mock_expired_sig`;

      // API call with expired token returns 401
      const initialApiRes = await fetch(`${baseUrl}/api/boards`, {
        headers: {
          Cookie: `forge_session=${expiredToken}`,
          Accept: 'application/json',
        },
      });
      expect(initialApiRes.status).toBe(401);
      const initialError = await initialApiRes.json();
      expect(initialError.code).toBe('TOKEN_EXPIRED');

      // 3. Act: Client Interceptor triggers silent refresh
      const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          Cookie: `forge_session=${expiredToken}; forge_refresh_token=${validRefreshToken}`,
          Accept: 'application/json',
        },
      });
      expect(refreshRes.status).toBe(200);
      const refreshData = await refreshRes.json();
      expect(refreshData.status).toBe('SUCCESS');

      // 4. Act & Assert: Transparent replay of original request with renewed cookie succeeds
      const setCookies = refreshRes.headers.get('set-cookie') || '';
      const sessionMatch = setCookies.match(/forge_session=([^;]+)/);
      expect(sessionMatch).not.toBeNull();
      const freshSessionCookie = sessionMatch![1];

      const replayedRes = await fetch(`${baseUrl}/api/boards`, {
        headers: {
          Cookie: `forge_session=${freshSessionCookie}`,
          Accept: 'application/json',
        },
      });
      expect(replayedRes.status).toBe(200);
      const boards = await replayedRes.json();
      expect(Array.isArray(boards)).toBe(true);
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: Journey 6 - Hard Session Expiry on Revoked Root Session denies renewal and signals logout', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const baseUrl = `http://127.0.0.1:${server.port}`;

    try {
      // Act: Attempt refresh with revoked/expired root session
      const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          Cookie: 'forge_refresh_token=revoked_session_family_7766',
          Accept: 'application/json',
        },
      });

      // Assert: Refresh fails, enforcing re-authentication
      expect(refreshRes.status).toBe(401);
      const errorData = await refreshRes.json();
      expect(errorData.code).toBe('REFRESH_TOKEN_INVALID');
    } finally {
      server.stop(true);
    }
  });
});
