/**
 * @forge-apps/goals/test/unit - Template Sanity & Database Unit Tests (Tier 1)
 * 3A Pattern (Arrange, Act, Assert)
 */

import { describe, expect, it } from 'bun:test';
import { goalsDb, getUserById, upsertUser } from '../../src/db';

describe('Tier 1 Unit: Individual Goal Center Database & Invariants [LLR-APP-002]', () => {
  it('Arrange, Act, Assert: initializes goals_items table and executes CRUD queries', () => {
    // Arrange
    const itemId = `item_${Date.now()}`;
    const itemName = 'Scaffold Test Asset';

    // Act
    goalsDb.run('INSERT INTO goals_items (id, name, created_at) VALUES (?, ?, ?);', [
      itemId,
      itemName,
      Date.now(),
    ]);

    const item = goalsDb
      .query('SELECT * FROM goals_items WHERE id = ?;')
      .get(itemId) as { id: string; name: string; created_at: number };

    // Assert
    expect(item).toBeDefined();
    expect(item.id).toBe(itemId);
    expect(item.name).toBe(itemName);

    // Cleanup
    goalsDb.run('DELETE FROM goals_items WHERE id = ?;', [itemId]);
  });

  it('Arrange, Act, Assert: persists and retrieves rich employee identity with department and manager', () => {
    // Arrange
    const testUser = {
      id: 'usr_unit_rich_emp',
      email: 'rich.emp@forge.internal',
      displayName: 'Aarav Mehta',
      roles: ['roles/employee'],
      department: 'Core Platform Engineering',
      managerId: 'usr_unit_mgr',
      managerName: 'Rohan Kulkarni',
      managerEmail: 'bob.lead@forge.internal',
      jobTitle: 'Principal Systems Architect',
      employeeCode: 'EMP-9481',
    };

    // Act
    const saved = upsertUser(testUser);
    const retrieved = getUserById(testUser.id);

    // Assert
    expect(saved).toBeDefined();
    expect(retrieved).toBeDefined();
    expect(retrieved?.displayName).toBe('Aarav Mehta');
    expect(retrieved?.department).toBe('Core Platform Engineering');
    expect(retrieved?.managerName).toBe('Rohan Kulkarni');
    expect(retrieved?.jobTitle).toBe('Principal Systems Architect');
    expect(retrieved?.employeeCode).toBe('EMP-9481');

    // Cleanup
    goalsDb.run('DELETE FROM users WHERE id = ?;', [testUser.id]);
  });

  it('Arrange, Act, Assert: cleanDisplayName strips designation parentheses from names', async () => {
    // Arrange
    const { cleanDisplayName } = await import('../../src/lib/ui');

    // Act & Assert
    expect(cleanDisplayName('Arjun Nair (Design Engineer)')).toBe('Arjun Nair');
    expect(cleanDisplayName('Tanvi Hegde (Staff UI Architect)')).toBe('Tanvi Hegde');
    expect(cleanDisplayName('Sarah Connor')).toBe('Sarah Connor');
    expect(cleanDisplayName(null)).toBe('');
    expect(cleanDisplayName(undefined)).toBe('');
  });

  it('Arrange, Act, Assert: renders "No Team Under You" when employee has zero direct reports', async () => {
    const { renderTeamReviewsSection } = await import('../../src/frontend/views/team-reviews-list');
    const user = {
      id: 'usr_no_team',
      email: 'solo@forge.internal',
      displayName: 'Solo Contributor',
      roles: ['roles/manager'],
      directReportsCount: 0,
      isManagerInDirectory: false,
    };

    const html = renderTeamReviewsSection(user, []);
    expect(html).toContain('No Team Under You');
    expect(html).toContain('zero direct reports');
  });

  it('Arrange, Act, Assert: renders "No Team of Managers Under You" and employee sublists when direct reports are ICs', async () => {
    const { renderTeamReviewsSection } = await import('../../src/frontend/views/team-reviews-list');
    const user = {
      id: 'usr_frontline_mgr',
      email: 'lead@forge.internal',
      displayName: 'Frontline Lead',
      roles: ['roles/manager'],
      directReportsCount: 1,
      subordinateManagersCount: 0,
      isManagerInDirectory: true,
    };

    const sampleBoard = {
      id: 'board_test_sub',
      orgId: 'org_default',
      ownerId: 'usr_rep_1',
      ownerName: 'Vikramaditya Patel',
      ownerEmail: 'vikram@forge.internal',
      ownerDepartment: 'Accounting & Billing',
      title: 'Q3 Financial Consolidation',
      status: 'REWORK_REQUESTED' as const,
      lockVersion: 1,
      revisionNumber: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const html = renderTeamReviewsSection(user, [sampleBoard]);
    expect(html).toContain('No Team of Managers Under You');
    expect(html).toContain('Vikramaditya Patel');
    expect(html).toContain('Q3 Financial Consolidation');
    expect(html).toContain('team-sublist-table-view');
    expect(html).toContain('team-sublist-cards-list');
    expect(html).toContain('team-board-row-card');
    expect(html).toContain('team-sublist-cards-view');
  });

  it('Arrange, Act, Assert: renders "No Team of Managers Under You" empty state when frontline manager has 0 submitted boards', async () => {
    const { renderTeamReviewsSection } = await import('../../src/frontend/views/team-reviews-list');
    const frontlineUser = {
      id: 'usr_frontline_lead',
      email: 'frontline@forge.internal',
      displayName: 'Frontline Manager',
      roles: ['roles/manager'],
      directReportsCount: 3,
      subordinateManagersCount: 0,
      isManagerInDirectory: true,
    };

    const html = renderTeamReviewsSection(frontlineUser, []);
    expect(html).toContain('No Team of Managers Under You');
    expect(html).toContain('Frontline Leadership • Directory Verified');
    expect(html).toContain('individual contributors');
    expect(html).not.toContain('SG Forge');
    expect(html).not.toContain('sgforge');
  });

  it('Arrange, Act, Assert: renders "No Team Goal Plans Submitted" when multi-tier manager has 0 boards', async () => {
    const { renderTeamReviewsSection } = await import('../../src/frontend/views/team-reviews-list');
    const directorUser = {
      id: 'usr_director',
      email: 'director@forge.internal',
      displayName: 'Director of Engineering',
      roles: ['roles/manager'],
      directReportsCount: 4,
      subordinateManagersCount: 2,
      isManagerInDirectory: true,
    };

    const html = renderTeamReviewsSection(directorUser, []);
    expect(html).toContain('No Team Goal Plans Submitted');
    expect(html).toContain('Multi-Tier Leadership');
    expect(html).not.toContain('SG Forge');
    expect(html).not.toContain('sgforge');
  });

  it('Arrange, Act, Assert: renders apex no-manager banner when employee has no manager above them with zero SG Forge mentions', async () => {
    const { renderManagerView } = await import('../../src/frontend/views/manager-view');
    const apexUser = {
      id: 'usr_ceo',
      email: 'ceo@forge.internal',
      displayName: 'Executive Leader',
      roles: ['roles/super_admin'],
      managerId: null,
      managerName: null,
      hasManagerAbove: false,
    };

    const html = renderManagerView(apexUser, [], []);
    expect(html).toContain('Apex Leadership • No Upward Manager Assigned • No Submission Cycle');
    expect(html).not.toContain('SG Forge');
    expect(html).not.toContain('sgforge');
  });
});
