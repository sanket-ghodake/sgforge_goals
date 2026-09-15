/**
 * @forge-apps/goals/test/unit - Template Sanity & Database Unit Tests (Tier 1)
 * 3A Pattern (Arrange, Act, Assert)
 */

import { describe, expect, it } from 'bun:test';
import { goalsDb } from '../../src/db';

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
});
