/**
 * @forge-apps/goals - Tier 1 Unit: Session Refresh Engine & Token Verification
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 * @requirements [HLR-SDK-301] [LLR-AUTH-006]
 */

import { describe, expect, it } from 'bun:test';
import { extractRefreshToken, handleSessionRefresh } from '../../src/lib/auth-refresh';
import { verifySessionToken } from '../../src/lib/sdk';

describe('Tier 1 Unit: Token Auto-Renewal & Cookie Extraction Engine', () => {
  it('Arrange, Act, Assert: extracts refresh token from standard HTTP Cookie header', async () => {
    // Arrange
    const sampleToken = 'rtr_alpha_numeric_secret_sample_token_123';
    const req = new Request('http://localhost:8090/api/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: `theme=dark; forge_refresh_token=${sampleToken}; other_pref=1`,
      },
    });

    // Act
    const extracted = await extractRefreshToken(req);

    // Assert
    expect(extracted).toBe(sampleToken);
  });

  it('Arrange, Act, Assert: extracts refresh token from JSON body payload fallback', async () => {
    // Arrange
    const sampleToken = 'rtr_payload_secret_sample_token_456';
    const req = new Request('http://localhost:8090/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: sampleToken }),
    });

    // Act
    const extracted = await extractRefreshToken(req);

    // Assert
    expect(extracted).toBe(sampleToken);
  });

  it('Arrange, Act, Assert: returns null when no refresh token exists in cookies or body', async () => {
    // Arrange
    const req = new Request('http://localhost:8090/api/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: 'theme=dark; ui_sidebar=collapsed',
      },
    });

    // Act
    const extracted = await extractRefreshToken(req);

    // Assert
    expect(extracted).toBeNull();
  });

  it('Arrange, Act, Assert: returns 401 RFC 7807 problem details when refresh token is missing', async () => {
    // Arrange
    const req = new Request('http://localhost:8090/api/auth/refresh', {
      method: 'POST',
    });

    // Act
    const res = await handleSessionRefresh(req);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(401);
    expect(body.code).toBe('REFRESH_TOKEN_MISSING');
    expect(body.title).toContain('Refresh Token Missing');
  });

  it('Arrange, Act, Assert: returns 401 when refresh token is marked expired or revoked', async () => {
    // Arrange
    const req = new Request('http://localhost:8090/api/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: 'forge_refresh_token=expired_token_family_xyz',
      },
    });

    // Act
    const res = await handleSessionRefresh(req);
    const body = await res.json();

    // Assert
    expect(res.status).toBe(401);
    expect(body.code).toBe('REFRESH_TOKEN_INVALID');
  });

  it('Arrange, Act, Assert: generates fresh verifiable session token upon valid refresh', async () => {
    // Arrange
    const validRefreshToken = 'rtr_valid_session_token_family_abc123456';
    const req = new Request('http://localhost:8090/api/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: `forge_refresh_token=${validRefreshToken}`,
      },
    });

    // Act
    const res = await handleSessionRefresh(req);
    const body = await res.json();
    const setCookie = res.headers.get('set-cookie') || '';

    // Assert
    expect(res.status).toBe(200);
    expect(body.status).toBe('SUCCESS');
    expect(body.accessToken).toBeDefined();
    expect(setCookie).toContain('forge_session=');
    expect(setCookie).toContain('forge_refresh_token=');

    // Verify generated session token structure and validity
    const verification = verifySessionToken(body.accessToken);
    expect(verification.valid).toBe(true);
    expect(verification.payload).toBeDefined();
    expect(verification.payload.sub).toBeDefined();
  });
});
