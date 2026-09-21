/**
 * @forge-apps/goals - Tier 2 Integration: Session Auto-Renewal HTTP Endpoint
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 * @requirements [HLR-SDK-301] [LLR-AUTH-006]
 */

import { describe, expect, it } from 'bun:test';
import { startgoalsServer } from '../../src/server';

describe('Tier 2 Integration: Session Auto-Renewal Endpoint (/api/auth/refresh)', () => {
  it('Arrange, Act, Assert: rejects unauthenticated refresh request with 401 RFC 7807', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act: Call refresh with no credentials
      const res = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(401);
      expect(res.headers.get('Content-Type')).toContain('application/problem+json');
      expect(data.code).toBe('REFRESH_TOKEN_MISSING');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: exchanges valid refresh token for fresh session and unlocks protected API', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const baseUrl = `http://localhost:${server.port}`;
    const mockRefreshToken = 'rtr_integration_test_secret_family_998877';

    try {
      // Act 1: Request token refresh
      const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          Cookie: `forge_refresh_token=${mockRefreshToken}`,
        },
      });
      const refreshData = await refreshRes.json();
      const setCookies = refreshRes.headers.get('set-cookie') || '';

      // Assert 1: Refresh response conforms to security contract
      expect(refreshRes.status).toBe(200);
      expect(refreshData.status).toBe('SUCCESS');
      expect(refreshData.accessToken).toBeDefined();
      expect(setCookies).toContain('forge_session=');
      expect(setCookies).toContain('forge_refresh_token=');

      // Act 2: Extract new session cookie and call protected endpoint
      const sessionMatch = setCookies.match(/forge_session=([^;]+)/);
      expect(sessionMatch).not.toBeNull();
      const newSessionCookie = sessionMatch![1];

      const protectedRes = await fetch(`${baseUrl}/api/boards`, {
        headers: {
          Cookie: `forge_session=${newSessionCookie}`,
          Accept: 'application/json',
        },
      });

      // Assert 2: Protected endpoint accepts the renewed session token
      expect(protectedRes.status).toBe(200);
      const boards = await protectedRes.json();
      expect(Array.isArray(boards)).toBe(true);
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: preserves user identity claims across token renewal', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const baseUrl = `http://localhost:${server.port}`;
    // Provide an expired session token along with the refresh token
    const expiredHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const expiredPayload = Buffer.from(
      JSON.stringify({
        sub: 'usr_meera_qa',
        roles: ['roles/manager', 'roles/employee'],
        exp: Math.floor(Date.now() / 1000) - 600, // expired 10m ago
      })
    ).toString('base64url');
    const expiredToken = `${expiredHeader}.${expiredPayload}.mock_sig`;

    try {
      // Act
      const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          Cookie: `forge_session=${expiredToken}; forge_refresh_token=rtr_meera_active_refresh_token`,
        },
      });
      const data = await refreshRes.json();

      // Assert
      expect(refreshRes.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe('usr_meera_qa');
      expect(data.user.roles).toContain('roles/manager');
    } finally {
      server.stop(true);
    }
  });
});
