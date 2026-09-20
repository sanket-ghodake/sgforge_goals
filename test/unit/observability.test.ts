/**
 * @forge-apps/goals - Tier 1 Unit: Observability, Distributed Tracing & Blast Radius
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [LLR-GOALS-005]
 */

import { describe, expect, it } from 'bun:test';
import {
  extractOrGenerateTraceId,
  redactSensitiveData,
  emitCanonicalRequestLog,
  parseBlastRadius,
} from '../../src/lib/telemetry';

describe('Tier 1 Unit: Observability & Distributed Tracing Standards', () => {
  it('Arrange, Act, Assert: extracts incoming x-trace-id header if present', () => {
    // Arrange
    const req = new Request('http://localhost:8090/health', {
      headers: { 'x-trace-id': 'custom-trace-id-9988' },
    });

    // Act
    const traceId = extractOrGenerateTraceId(req);

    // Assert
    expect(traceId).toBe('custom-trace-id-9988');
  });

  it('Arrange, Act, Assert: extracts trace ID from W3C traceparent header', () => {
    // Arrange
    const req = new Request('http://localhost:8090/api/boards', {
      headers: { 'traceparent': '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' },
    });

    // Act
    const traceId = extractOrGenerateTraceId(req);

    // Assert
    expect(traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
  });

  it('Arrange, Act, Assert: generates deterministic trace_ prefix when header missing', () => {
    // Arrange
    const req = new Request('http://localhost:8090/api/boards');

    // Act
    const traceId = extractOrGenerateTraceId(req);

    // Assert
    expect(traceId.startsWith('trace_')).toBe(true);
    expect(traceId.length).toBeGreaterThan(12);
  });

  it('Arrange, Act, Assert: recursively redacts sensitive tokens and credentials', () => {
    // Arrange
    const rawPayload = {
      username: 'alex',
      password: 'super-secret-password-123',
      nested: {
        api_token: 'tok_abc123xyz',
        authSecret: 'shhh',
        safeMetadata: 'goal-review-2026',
      },
      headerSnippet: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDN-dF9-WnSO7771Z1eDZBRvUMw',
    };

    // Act
    const sanitized = redactSensitiveData(rawPayload) as any;

    // Assert
    expect(sanitized.username).toBe('alex');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.nested.api_token).toBe('[REDACTED]');
    expect(sanitized.nested.authSecret).toBe('[REDACTED]');
    expect(sanitized.nested.safeMetadata).toBe('goal-review-2026');
    expect(sanitized.headerSnippet).toContain('Bearer [REDACTED]');
  });

  it('Arrange, Act, Assert: emits structured canonical access log with duration and traceId', () => {
    // Arrange
    const loggedEntries: Array<{ msg: string; meta?: any }> = [];
    const mockLogger = {
      info: (msg: string, meta?: any) => loggedEntries.push({ msg, meta }),
      warn: (msg: string, meta?: any) => loggedEntries.push({ msg, meta }),
      error: (msg: string, meta?: any) => loggedEntries.push({ msg, meta }),
    };

    // Act
    emitCanonicalRequestLog(mockLogger, {
      env: 'production',
      traceId: 'trace_test_123',
      method: 'GET',
      path: '/api/boards',
      status: 200,
      durationMs: 8.45,
      userId: 'usr_emp_42',
      orgId: 'org_phoenix',
    });

    // Assert
    expect(loggedEntries.length).toBe(1);
    expect(loggedEntries[0].msg).toContain('[GET] /api/boards -> 200');
    expect(loggedEntries[0].meta.type).toBe('CANONICAL_REQUEST');
    expect(loggedEntries[0].meta.traceId).toBe('trace_test_123');
    expect(loggedEntries[0].meta.userId).toBe('usr_emp_42');
  });

  it('Arrange, Act, Assert: accurately parses blast radius, smooth journeys, and SLO', () => {
    // Arrange
    const now = Date.now();
    const sampleLogs = [
      JSON.stringify({ timestamp: new Date(now - 1000).toISOString(), status: 200, userId: 'usr-1', env: 'production', path: '/api/boards' }),
      JSON.stringify({ timestamp: new Date(now - 2000).toISOString(), status: 200, userId: 'usr-1', env: 'production', path: '/api/projects' }),
      JSON.stringify({ timestamp: new Date(now - 3000).toISOString(), status: 200, userId: 'usr-2', env: 'production', path: '/api/boards' }),
      JSON.stringify({ timestamp: new Date(now - 4000).toISOString(), status: 500, userId: 'usr-3', errorCode: 'DB_LOCKED', message: 'Database busy timeout', env: 'production', traceId: 'trace_err_1', path: '/api/boards/1/submit' }),
    ].join('\n');

    // Act
    const report = parseBlastRadius(sampleLogs, { envFilter: 'production', windowMs: 60000, nowMs: now });

    // Assert
    expect(report.totalRequests).toBe(4);
    expect(report.totalUniqueUsers).toBe(3);
    expect(report.smoothJourneysCount).toBe(2); // usr-1 and usr-2 had 0 errors
    expect(report.impactedJourneysCount).toBe(1); // usr-3 had error
    expect(report.impactedUsers[0].userId).toBe('usr-3');
    expect(report.impactedUsers[0].errorCode).toBe('DB_LOCKED');
    expect(report.statusBreakdown[200]).toBe(3);
    expect(report.statusBreakdown[500]).toBe(1);
    expect(report.sloMet).toBe(false); // 75% < 99.9%
  });
});
