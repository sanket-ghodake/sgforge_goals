/**
 * @forge-apps/goals - Tier 5 E2E: Team Reviews Hierarchy Journeys & Empty State Verification
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 * Validates organizational hierarchy display rules and zero "SG Forge" brand leakage.
 * @requirements [HLR-UI-201] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import { describe, expect, it } from 'bun:test';
import { createInternalServiceToken } from '../../src/lib/sdk';
import { startgoalsServer } from '../../src/server';
import { goalsDb } from '../../src/db';

describe('Tier 5 E2E: Team Reviews Organizational Hierarchy Journeys', () => {
  it('Arrange, Act, Assert: Journey 1 - Individual contributor with 0 reports receives No Team Under You', async () => {
    // Arrange: Start isolated ephemeral server
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager', 'roles/employee'], 'usr-meera-qa');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act: Request reviews view as an employee with zero reports
      const res = await fetch(`${baseUrl}/?tab=reviews`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      const html = await res.text();

      // Assert
      expect(res.status).toBe(200);
      expect(html).toContain('No Team Under You');
      expect(html).toContain('Directory Verified');
      expect(html).toContain('zero direct reports or subordinate team members');
      expect(html).not.toContain('SG Forge');
      expect(html).not.toContain('sgforge');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: Journey 2 - Frontline manager with 0 submitted boards receives No Team of Managers Under You empty state', async () => {
    // Arrange: Start isolated server
    const server = startgoalsServer(0);
    // Aditi Sharma manages ICs (Amitabh & Neha), neither has submitted a board yet
    const token = createInternalServiceToken(['roles/manager', 'roles/employee'], 'usr-alice-eng');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act: Request reviews tab
      const res = await fetch(`${baseUrl}/?tab=reviews`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      const html = await res.text();

      // Assert
      expect(res.status).toBe(200);
      expect(html).toContain('No Team of Managers Under You');
      expect(html).toContain('Frontline Leadership • Directory Verified');
      expect(html).toContain('individual contributors');
      expect(html).toContain('Switch to My Submissions');
      // Must not render confusing empty search bar or redundant empty cards
      expect(html).not.toContain('No Team Flight Plans Submitted');
      expect(html).not.toContain('SG Forge');
      expect(html).not.toContain('sgforge');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: Journey 3 - Frontline manager with submitted team boards displays banner and board sublists', async () => {
    // Arrange: Insert a temporary goal board submitted by Aditi\'s report (Amitabh)
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager', 'roles/employee'], 'usr-alice-eng');
    const baseUrl = `http://localhost:${server.port}`;
    const tempBoardId = 'board-e2e-amit-temp-' + Date.now();

    try {
      goalsDb.run(`
        INSERT INTO goal_boards (id, org_id, project_id, owner_id, owner_name, owner_email, owner_department, title, cycle, status, lock_version, revision_number, created_at, updated_at)
        VALUES (?, 'org_default', 'proj-core', 'usr-amit-dev', 'Amitabh Mukherjee', 'amitabh.mukherjee@forge.internal', 'Platform Engineering', 'Telemetry Pipeline Stream', '2026-Q3', 'SUBMITTED', 1, 1, ?, ?)
      `, [tempBoardId, Date.now(), Date.now()]);

      // Act: Fetch reviews tab
      const res = await fetch(`${baseUrl}/?tab=reviews`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      const html = await res.text();

      // Assert: Top banner is shown alongside the board list and search toolbar
      expect(res.status).toBe(200);
      expect(html).toContain('No Team of Managers Under You');
      expect(html).toContain('Frontline Leadership');
      expect(html).toContain('Amitabh Mukherjee');
      expect(html).toContain('Telemetry Pipeline Stream');
      expect(html).toContain('teamReviewsSearch');
      expect(html).not.toContain('SG Forge');
      expect(html).not.toContain('sgforge');
    } finally {
      goalsDb.run('DELETE FROM goal_boards WHERE id = ?', [tempBoardId]);
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: Journey 4 - Multi-tier manager with 0 boards receives Multi-Tier Leadership empty view', async () => {
    // Arrange: Start isolated server
    const server = startgoalsServer(0);
    // Rohan Kulkarni manages Aditi and Tanvi (who are managers)
    const token = createInternalServiceToken(['roles/manager', 'roles/employee'], 'usr-bob-lead');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act: Fetch reviews tab when no reports have submitted boards for Rohan
      const res = await fetch(`${baseUrl}/?tab=reviews`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      const html = await res.text();

      // Assert
      expect(res.status).toBe(200);
      expect(html).toContain('Multi-Tier Leadership');
      expect(html).toContain('No Team Flight Plans Submitted');
      expect(html).toContain('Switch to My Submissions');
      expect(html).not.toContain('SG Forge');
      expect(html).not.toContain('sgforge');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: Journey 5A - Apex executive receives Apex Leadership banner in Reviews Hub with zero SG Forge mentions', async () => {
    // Arrange: Start isolated server
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/super_admin'], 'usr-superadmin');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act: Fetch reviews tab
      const res = await fetch(`${baseUrl}/?tab=reviews`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      const html = await res.text();

      // Assert
      expect(res.status).toBe(200);
      expect(html).toContain('Apex Leadership • No Upward Manager Assigned • No Submission Cycle');
      expect(html).toContain('Self-Governed');
      expect(html).toContain('Self-directed');
      expect(html).toContain('You currently have no reporting manager mapped in the organization directory');
      expect(html).not.toContain('SG Forge');
      expect(html).not.toContain('sgforge');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: Journey 5B - Apex executive receives Self-Governed banner in My Goal Boards tab', async () => {
    // Arrange: Start isolated server
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/super_admin'], 'usr-superadmin');
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act: Fetch boards tab (?tab=boards)
      const res = await fetch(`${baseUrl}/?tab=boards`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      const html = await res.text();

      // Assert
      expect(res.status).toBe(200);
      expect(html).toContain('Apex Contributor Mode: Your flight plans are self-governed and do not require manager approval submission cycles.');
      expect(html).toContain('Self-Governed');
      expect(html).not.toContain('SG Forge');
      expect(html).not.toContain('sgforge');
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: Journey 5C - Apex executive sees Apex Profile on Board Canvas when no manager is assigned', async () => {
    // Arrange: Start isolated server
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/super_admin'], 'usr-superadmin');
    const baseUrl = `http://localhost:${server.port}`;
    const tempBoardId = 'board-e2e-apex-canvas-' + Date.now();

    try {
      // Create a draft board for apex user with managerId = null
      goalsDb.run(`
        INSERT INTO goal_boards (id, org_id, project_id, owner_id, owner_name, owner_email, owner_department, title, cycle, status, lock_version, revision_number, created_at, updated_at)
        VALUES (?, 'org_default', 'proj-core', 'usr-superadmin', 'Rajesh Sharma', 'superadmin@forge.internal', 'Executive', 'Apex Strategic Initiatives', '2026-Q3', 'DRAFT', 1, 1, ?, ?)
      `, [tempBoardId, Date.now(), Date.now()]);

      // Act: Fetch board view (?tab=board&id=...)
      const res = await fetch(`${baseUrl}/?tab=board&id=${tempBoardId}`, {
        headers: { Cookie: `forge_session=${token}` },
      });
      const html = await res.text();

      // Assert
      expect(res.status).toBe(200);
      expect(html).toContain('Apex Profile: No Manager Above • No Submission Cycle');
      expect(html).toContain('Self-governed milestone flight plan.');
      expect(html).toContain('Self-Governed');
      expect(html).not.toContain('SG Forge');
      expect(html).not.toContain('sgforge');
    } finally {
      goalsDb.run('DELETE FROM goal_boards WHERE id = ?', [tempBoardId]);
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: Journey 5D - Apex executive can submit board without manager and transition cleanly into locked review state', async () => {
    // Arrange: Start isolated server
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/super_admin'], 'usr-superadmin');
    const baseUrl = `http://localhost:${server.port}`;
    const tempBoardId = 'board-e2e-apex-submit-' + Date.now();
    const tempItemId = 'item-e2e-apex-1-' + Date.now();

    try {
      goalsDb.run(`
        INSERT INTO goal_boards (id, org_id, project_id, owner_id, owner_name, owner_email, owner_department, title, cycle, status, lock_version, revision_number, created_at, updated_at)
        VALUES (?, 'org_default', 'proj-core', 'usr-superadmin', 'Rajesh Sharma', 'superadmin@forge.internal', 'Executive', 'Global Expansion Vector', '2026-Q3', 'DRAFT', 1, 1, ?, ?)
      `, [tempBoardId, Date.now(), Date.now()]);

      goalsDb.run(`
        INSERT INTO goal_items (id, board_id, title, description, category, target_date, weight, progress_percent, status, created_at, updated_at)
        VALUES (?, ?, 'Milestone 100%', 'Complete rollout', 'DELIVERABLE', '2026-09-30', 100, 0, 'PENDING', ?, ?)
      `, [tempItemId, tempBoardId, Date.now(), Date.now()]);

      // Act: Submit board via POST /api/boards/:id/submit
      const submitRes = await fetch(`${baseUrl}/api/boards/${tempBoardId}/submit`, {
        method: 'POST',
        headers: {
          Cookie: `forge_session=${token}`,
          'Content-Type': 'application/json',
        },
      });
      const submitData = await submitRes.json();

      // Assert: Successfully transitions without errors despite having no upward manager
      expect(submitRes.status).toBe(200);
      expect(submitData.status).toBe('SUBMITTED');
      expect(submitData.id).toBe(tempBoardId);

      // Verify reminder notification was routed cleanly
      const reminder = goalsDb.query<{ message: string }, [string]>('SELECT message FROM reminders WHERE board_id = ?').get(tempBoardId);
      expect(reminder).toBeDefined();
      expect(reminder?.message).toContain('No manager assigned - routed to Admin');
    } finally {
      goalsDb.run('DELETE FROM goal_items WHERE board_id = ?', [tempBoardId]);
      goalsDb.run('DELETE FROM goal_boards WHERE id = ?', [tempBoardId]);
      goalsDb.run('DELETE FROM reminders WHERE board_id = ?', [tempBoardId]);
      server.stop(true);
    }
  });
});
