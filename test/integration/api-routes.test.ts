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
    const token = createInternalServiceToken(['roles/manager'], 'usr_integ_1');
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

      // Act: POST api/projects then POST api/boards
      const projRes = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `forge_session=${token}`,
        },
        body: JSON.stringify({
          name: 'Dynamic Integration Project',
          code: 'DYNINT',
          description: 'Project created dynamically for integration test',
        }),
      });
      const project = await projRes.json();
      expect(projRes.status).toBe(201);

      const createRes = await fetch(`${baseUrl}/api/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `forge_session=${token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
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

  it('Arrange, Act, Assert: creates project via POST api/projects and lists via GET api/projects', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager'], 'usr_integ_proj');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act 1: POST api/projects
      const createRes = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `forge_session=${token}`,
        },
        body: JSON.stringify({
          name: 'Core Ingestion Fabric',
          code: 'FABRIC',
          description: 'High-throughput stream engine',
        }),
      });
      const project = await createRes.json();

      // Assert 1
      expect(createRes.status).toBe(201);
      expect(project.id).toBeDefined();
      expect(project.name).toBe('Core Ingestion Fabric');
      expect(project.code).toBe('FABRIC');

      // Act 2: GET api/projects
      const listRes = await fetch(`${baseUrl}/api/projects`, {
        headers: { 'Cookie': `forge_session=${token}` },
      });
      const projects = await listRes.json();

      // Assert 2
      expect(listRes.status).toBe(200);
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.some((p: any) => p.code === 'FABRIC')).toBe(true);
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: renders dashboard and boards views via GET api/views', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager'], 'usr_integ_1');
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

      // Act 4: Create a board and POST api/boards/:id/comments
      const projRes = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `forge_session=${token}` },
        body: JSON.stringify({ name: 'Feedback Project', code: 'FEED', description: 'Test project' }),
      });
      const proj = await projRes.json();

      const newBoardRes = await fetch(`${baseUrl}/api/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `forge_session=${token}` },
        body: JSON.stringify({ projectId: proj.id, title: 'Comment Board', cycle: '2026-Q1' }),
      });
      const createdBoard = await newBoardRes.json();
      const targetBoardId = createdBoard.id;

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
    const token = createInternalServiceToken(['roles/manager'], 'usr_integ_1');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act 1: POST api/auth/login
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `forge_session=${token}`,
        },
        body: JSON.stringify({}),
      });
      const loginBody = await loginRes.json();

      // Assert 1
      expect(loginRes.status).toBe(200);
      expect(loginBody.success).toBe(true);
      expect(loginBody.redirectUrl).toBeDefined();

      // Act 2: GET api/auth/users
      const usersRes = await fetch(`${baseUrl}/api/auth/users`, {
        headers: { 'Cookie': `forge_session=${token}` },
      });
      const users = await usersRes.json();

      // Assert 2
      expect(usersRes.status).toBe(200);
      expect(Array.isArray(users)).toBe(true);

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
      expect(logoutCookie).toContain('goals_logged_out=true');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: returns authenticated employee profile via GET api/auth/me and employee list via api/org/employees', async () => {
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager'], 'usr_integ_me');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act: GET api/auth/me
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      const meData = await meRes.json();

      expect(meRes.status).toBe(200);
      expect(meData.ok).toBe(true);
      expect(meData.user.id).toBe('usr_integ_me');

      // Act: GET api/org/employees
      const empRes = await fetch(`${baseUrl}/api/org/employees`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      const empData = await empRes.json();

      expect(empRes.status).toBe(200);
      expect(empData.items).toBeDefined();
      expect(Array.isArray(empData.items)).toBe(true);
    } finally {
      server.stop(true);
    }
  });
});
