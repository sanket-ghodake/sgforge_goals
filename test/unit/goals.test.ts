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
});
