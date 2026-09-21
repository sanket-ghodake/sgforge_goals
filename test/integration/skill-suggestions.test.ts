/**
 * Individual Goal Center - Live Suggestions Integration Test Suite (2026 LTS)
 * Verifies org-wide suggestions for skills, gaps, and training plans.
 * Tests frequency sorting, category prioritization, and strict tenant isolation.
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001] [LLR-GOALS-002]
 */

import { describe, expect, it } from 'bun:test';
import { goalsDb } from '../../src/db';
import { getSkillSuggestions } from '../../src/backend/services/board-actions-service';
import { startgoalsServer } from '../../src/server';

describe('Tier 2 Integration: Organization-Wide Live Skill & Plan Suggestions', () => {
  const orgAlpha = `org_alpha_${Date.now()}`;
  const orgBeta = `org_beta_${Date.now()}`;

  // Seed sample boards and items in orgAlpha
  const b1 = `board_sug_1_${Date.now()}`;
  const b2 = `board_sug_2_${Date.now()}`;
  const b3 = `board_sug_3_${Date.now()}`;
  const bBeta = `board_beta_1_${Date.now()}`;
  const now = Date.now();

  goalsDb.run(`
    INSERT INTO goal_boards (id, org_id, owner_id, owner_name, owner_email, owner_department, title, status, lock_version, revision_number, created_at, updated_at)
    VALUES 
      ('${b1}', '${orgAlpha}', 'usr_a1', 'Alpha Dev 1', 'a1@test.com', 'Eng', 'Board 1', 'DRAFT', 1, 1, ${now}, ${now}),
      ('${b2}', '${orgAlpha}', 'usr_a2', 'Alpha Dev 2', 'a2@test.com', 'Eng', 'Board 2', 'DRAFT', 1, 1, ${now}, ${now}),
      ('${b3}', '${orgAlpha}', 'usr_a3', 'Alpha Dev 3', 'a3@test.com', 'Eng', 'Board 3', 'DRAFT', 1, 1, ${now}, ${now}),
      ('${bBeta}', '${orgBeta}', 'usr_b1', 'Beta Dev 1', 'b1@test.com', 'Eng', 'Board Beta', 'DRAFT', 1, 1, ${now}, ${now})
  `);

  // Insert items with different frequency counts
  goalsDb.run(`
    INSERT INTO goal_items (id, board_id, title, category, target_date, weight, progress_percent, status, sort_order, created_at, updated_at)
    VALUES
      ('item_s1_${Date.now()}_1', '${b1}', 'Kubernetes Orchestration', 'CORE_SKILL', '2026-06-30', 25, 0, 'PENDING', 1, ${now}, ${now}),
      ('item_s2_${Date.now()}_2', '${b2}', 'Kubernetes Orchestration', 'CORE_SKILL', '2026-06-30', 25, 0, 'PENDING', 1, ${now}, ${now}),
      ('item_s3_${Date.now()}_3', '${b3}', 'Kubernetes Orchestration', 'CORE_SKILL', '2026-06-30', 25, 0, 'PENDING', 1, ${now}, ${now}),
      ('item_s4_${Date.now()}_4', '${b1}', 'GraphQL API Design', 'CORE_SKILL', '2026-06-30', 25, 0, 'PENDING', 2, ${now}, ${now}),
      ('item_s5_${Date.now()}_5', '${b1}', 'Cloud Security Gap', 'SKILL_GAP', '2026-06-30', 25, 0, 'PENDING', 3, ${now}, ${now}),
      ('item_s6_${Date.now()}_6', '${b2}', 'Cloud Security Gap', 'SKILL_GAP', '2026-06-30', 25, 0, 'PENDING', 2, ${now}, ${now}),
      ('item_s7_${Date.now()}_7', '${b1}', 'CKA Certification Training', 'STRATEGIC_PLAN', '2026-09-30', 25, 0, 'PENDING', 4, ${now}, ${now}),
      ('item_beta_${Date.now()}_8', '${bBeta}', 'Secret Beta Proprietary Skill', 'CORE_SKILL', '2026-06-30', 25, 0, 'PENDING', 1, ${now}, ${now})
  `);

  it('ranks suggestions by usage frequency in the organization', () => {
    const suggestions = getSkillSuggestions(orgAlpha, 'Kubernetes');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].title).toBe('Kubernetes Orchestration');
    expect(suggestions[0].usageCount).toBe(3);
  });

  it('performs case-insensitive live substring matching across all categories', () => {
    const suggestions = getSkillSuggestions(orgAlpha, 'cloud');
    expect(suggestions.length).toBeGreaterThan(0);
    const gap = suggestions.find(s => s.title === 'Cloud Security Gap');
    expect(gap).toBeDefined();
    expect(gap?.category).toBe('SKILL_GAP');
    expect(gap?.usageCount).toBe(2);
  });

  it('strictly enforces organization isolation without cross-tenant bleed', () => {
    const alphaResults = getSkillSuggestions(orgAlpha, 'Secret Beta');
    expect(alphaResults.length).toBe(0);

    const betaResults = getSkillSuggestions(orgBeta, 'Secret Beta');
    expect(betaResults.length).toBe(1);
    expect(betaResults[0].title).toBe('Secret Beta Proprietary Skill');
  });

  it('serves suggestions via GET /api/suggestions HTTP endpoint', async () => {
    const { upsertUser } = await import('../../src/db');
    const { createInternalServiceToken } = await import('../../src/lib/sdk');

    upsertUser({
      id: 'usr_a1',
      email: 'a1@test.com',
      displayName: 'Alpha Dev 1',
      roles: ['roles/manager'],
      department: 'Eng',
    });

    const token = createInternalServiceToken(['roles/manager'], 'usr_a1');
    const server = startgoalsServer(0);
    const port = server.port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/suggestions?q=kube`, {
        headers: {
          'Cookie': `forge_session=${token}`,
          'x-user-org': orgAlpha,
        },
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as Array<{ title: string; category: string; usageCount: number }>;
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].title).toBe('Kubernetes Orchestration');
    } finally {
      server.stop(true);
    }
  });
});
