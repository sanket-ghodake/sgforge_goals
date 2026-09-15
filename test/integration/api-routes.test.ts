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
      server.stop(true);
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
      server.stop(true);
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

      // Act 3: GET api/views?tab=reviews
      const reviewsRes = await fetch(`${baseUrl}/api/views?tab=reviews`, {
        headers: { 'Cookie': `forge_session=${token}` },
      });
      const reviewsBody = await reviewsRes.json();

      // Assert 3
      expect(reviewsRes.status).toBe(200);
      expect(reviewsBody.html).toContain('Reviews & Approvals Hub');
      expect(reviewsBody.html).toContain('My Submissions');
      expect(reviewsBody.html).toContain('Team Reviews');

      // Act 4: POST api/boards/:id/comments
      const listBoardsRes = await fetch(`${baseUrl}/api/boards`, { headers: { 'Cookie': `forge_session=${token}` } });
      const boardsList = await listBoardsRes.json();
      const targetBoardId = boardsList[0].id;

      const commentRes = await fetch(`${baseUrl}/api/boards/${targetBoardId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `forge_session=${token}`,
        },
        body: JSON.stringify({ commentText: 'Integ test feedback comment' }),
      });
      const boardWithComments = await commentRes.json();

      // Assert 4
      expect(commentRes.status).toBe(200);
      expect(boardWithComments.comments).toBeDefined();
      expect(boardWithComments.comments.some((c: any) => c.commentText === 'Integ test feedback comment')).toBe(true);
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: handles auth login and logout endpoints', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/employee'], 'usr_integ_1');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act 1: POST api/auth/login with solo persona
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `forge_session=${token}`,
        },
        body: JSON.stringify({ persona: 'solo' }),
      });
      const loginBody = await loginRes.json();
      const loginCookie = loginRes.headers.get('set-cookie');

      // Assert 1
      expect(loginRes.status).toBe(200);
      expect(loginBody.success).toBe(true);
      expect(loginCookie).toContain('goals_persona=solo');

      // Act 2: GET api/auth/users
      const usersRes = await fetch(`${baseUrl}/api/auth/users`, {
        headers: { 'Cookie': `forge_session=${token}` },
      });
      const users = await usersRes.json();

      // Assert 2
      expect(usersRes.status).toBe(200);
      expect(Array.isArray(users)).toBe(true);
      expect(users.some((u: any) => u.id === 'usr_solo')).toBe(true);

      // Act 3: POST api/auth/logout
      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Cookie': `forge_session=${token}` },
      });
      const logoutBody = await logoutRes.json();
      const logoutCookie = logoutRes.headers.get('set-cookie');

      // Assert 3
      expect(logoutRes.status).toBe(200);
      expect(logoutBody.success).toBe(true);
      expect(logoutCookie).toContain('Expires=Thu, 01 Jan 1970');
    } finally {
      server.stop(true);
    }
  });
});
