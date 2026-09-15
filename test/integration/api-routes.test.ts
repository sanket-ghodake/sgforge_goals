/**
 * @forge-apps/goals/test/integration - HTTP REST API Endpoint Integration Tests (Tier 2)
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001] [LLR-GOALS-002]
 */

import { describe, expect, it } from 'bun:test';
import { createInternalServiceToken } from '../../src/lib/sdk';
import { startgoalsServer } from '../../src/server';

describe('Tier 2 Integration: Goal Center REST API Dispatcher', () => {
  it('Arrange, Act, Assert: lists boards via GET api/boards and creates board via POST api/boards', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/employee'], 'usr_integ_1');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act: GET api/boards
      const listRes = await fetch(`${baseUrl}/api/boards`, {
        headers: {
          'Cookie': `forge_session=${token}`,
        },
      });
      const boards = await listRes.json();

      // Assert
      expect(listRes.status).toBe(200);
      expect(Array.isArray(boards)).toBe(true);

      // Act: POST api/boards
      const createRes = await fetch(`${baseUrl}/api/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `forge_session=${token}`,
        },
        body: JSON.stringify({
          projectId: 'proj_titan',
          title: 'Integ Test Flight Plan',
          cycle: '2026-Q1',
        }),
      });
      const board = await createRes.json();

      // Assert
      expect(createRes.status).toBe(201);
      expect(board.id).toBeDefined();
      expect(board.status).toBe('DRAFT');
    } finally {
      server.stop();
    }
  });

  it('Arrange, Act, Assert: toggles persona cookie via POST api/persona/toggle', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/employee'], 'usr_integ_1');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act: POST api/persona/toggle
      const res = await fetch(`${baseUrl}/api/persona/toggle`, {
        method: 'POST',
        headers: {
          'Cookie': `forge_session=${token}`,
        },
      });
      const body = await res.json();
      const setCookie = res.headers.get('set-cookie');

      // Assert
      expect(res.status).toBe(200);
      expect(body.persona).toBeDefined();
      expect(setCookie).toContain('goals_persona=');
    } finally {
      server.stop();
    }
  });

  it('Arrange, Act, Assert: renders dashboard and boards views via GET api/views', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/employee'], 'usr_integ_1');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act 1: GET api/views?tab=dashboard
      const dashRes = await fetch(`${baseUrl}/api/views?tab=dashboard`, {
        headers: { 'Cookie': `forge_session=${token}` },
      });
      const dashBody = await dashRes.json();

      // Assert 1
      expect(dashRes.status).toBe(200);
      expect(dashBody.activeTab).toBe('dashboard');
      expect(dashBody.html).toContain('Executive Dashboard');

      // Act 2: GET api/views?tab=boards
      const boardsRes = await fetch(`${baseUrl}/api/views?tab=boards`, {
        headers: { 'Cookie': `forge_session=${token}` },
      });
      const boardsBody = await boardsRes.json();

      // Assert 2
      expect(boardsRes.status).toBe(200);
      expect(boardsBody.activeTab).toBe('boards');
      expect(boardsBody.html).toContain('My Goal Boards');
    } finally {
      server.stop();
    }
  });
});
