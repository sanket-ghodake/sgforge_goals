/**
 * @forge-apps/goals - Tier 4 Contract: Health Schema Specification
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 */

import { describe, expect, it } from 'bun:test';
import { startgoalsServer } from '../../src/server';

describe('Tier 4 Contract: Individual Goal Center Health Schema [LLR-SUB-002] [HLR-APP-001] [LLR-APP-001]', () => {
  it('Arrange, Act, Assert: returns valid JSON health specification on /health', async () => {
    const server = startgoalsServer(0);

    try {
      const res = await fetch(`http://localhost:${server.port}/health`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(typeof data.status).toBe('string');
      expect(typeof data.app).toBe('string');
      expect(typeof data.livez).toBe('boolean');
      expect(typeof data.readyz).toBe('boolean');
      expect(typeof data.uptime).toBe('number');
      expect(typeof data.memoryMb).toBe('number');
    } finally {
      server.stop(true);
    }
  });
});
