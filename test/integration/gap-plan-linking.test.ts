/**
 * Individual Goal Center - Gap-Plan Linking Integration Test Suite (Tier 2)
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 * Tests gap-plan link toggling, avatar clusters, count badges, and link persistence.
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001] [LLR-GOALS-002]
 */

import { describe, expect, it } from 'bun:test';
import { createInternalServiceToken } from '../../src/lib/sdk';
import { startgoalsServer } from '../../src/server';
import { cloneBoard, deleteBoard, toggleGapPlanLink } from '../../src/backend/services/board-actions-service';
import { createBoard, getBoardById, updateGoalItems } from '../../src/backend/services/board-service';
import type { AuthUser } from '../../src/lib/types';

describe('Tier 2 Integration: Skill Gap to Training Plan Interactive Linking', () => {
  const user: AuthUser = {
    id: `usr_linker_${Date.now()}`,
    email: 'linker@forge.internal',
    displayName: 'Linker Engineer',
    roles: ['roles/manager'],
    department: 'Engineering',
    orgId: `org_link_${Date.now()}`,
  };

  it('Arrange, Act, Assert: links skill gap with training plan and reflects in board items', () => {
    // 1. Arrange
    const board = createBoard({ title: 'Linking Test Board' }, user);
    const updatedBoard = updateGoalItems(board.id, {
      items: [
        {
          title: 'Distributed Tracing Gap',
          description: '',
          category: 'SKILL_GAP',
          priority: 'CRITICAL',
          targetDate: '2026-06-30',
          weight: 50,
          progressPercent: 0,
          status: 'PENDING',
        },
        {
          title: 'OpenTelemetry Architecture Workshop',
          description: '',
          category: 'STRATEGIC_PLAN',
          priority: 'CRITICAL',
          targetDate: '2026-09-30',
          weight: 50,
          progressPercent: 0,
          status: 'PENDING',
        },
      ],
    }, user);

    const gap = updatedBoard.items?.find(i => i.category === 'SKILL_GAP')!;
    const plan = updatedBoard.items?.find(i => i.category === 'STRATEGIC_PLAN')!;
    expect(gap).toBeDefined();
    expect(plan).toBeDefined();
    expect(gap.plansCount).toBe(0);

    // 2. Act: Link gap to plan
    const linkedBoard = toggleGapPlanLink(board.id, gap.id, plan.id, user);

    // 3. Assert
    const refreshedGap = linkedBoard.items?.find(i => i.id === gap.id)!;
    const refreshedPlan = linkedBoard.items?.find(i => i.id === plan.id)!;

    expect(refreshedGap.plansCount).toBe(1);
    expect(refreshedGap.linkedPlanIds).toContain(plan.id);

    expect(refreshedPlan.linkedGapIds).toContain(gap.id);
    expect(refreshedPlan.linkedGaps?.length).toBe(1);
    expect(refreshedPlan.linkedGaps?.[0].title).toBe('Distributed Tracing Gap');
    expect(refreshedPlan.linkedGaps?.[0].priority).toBe('CRITICAL');

    // 4. Act: Toggle again to unlink
    const unlinkedBoard = toggleGapPlanLink(board.id, gap.id, plan.id, user);
    const finalGap = unlinkedBoard.items?.find(i => i.id === gap.id)!;
    const finalPlan = unlinkedBoard.items?.find(i => i.id === plan.id)!;

    expect(finalGap.plansCount).toBe(0);
    expect(finalGap.linkedPlanIds?.length).toBe(0);
    expect(finalPlan.linkedGaps?.length).toBe(0);
  });

  it('Arrange, Act, Assert: toggles link via HTTP POST /api/boards/:id/links endpoint', async () => {
    const server = startgoalsServer(0);
    const token = createInternalServiceToken(['roles/manager'], user.id);
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // 1. Arrange
      const board = createBoard({ title: 'HTTP Linking Board' }, user);
      const withItems = updateGoalItems(board.id, {
        items: [
          { title: 'Rust Systems Gap', description: '', category: 'SKILL_GAP', priority: 'MEDIUM', targetDate: '2026-06-30', weight: 50, progressPercent: 0, status: 'PENDING' },
          { title: 'Advanced Tokio Boot Camp', description: '', category: 'TACTICAL_PLAN', priority: 'MEDIUM', targetDate: '2026-09-30', weight: 50, progressPercent: 0, status: 'PENDING' },
        ],
      }, user);
      const gap = withItems.items?.find(i => i.category === 'SKILL_GAP')!;
      const plan = withItems.items?.find(i => i.category === 'TACTICAL_PLAN')!;

      // 2. Act: Call HTTP endpoint
      const res = await fetch(`${baseUrl}/api/boards/${board.id}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `forge_session=${token}`,
          'x-user-org': user.orgId!,
        },
        body: JSON.stringify({ gapId: gap.id, planId: plan.id }),
      });

      expect(res.status).toBe(200);
      const updated = await res.json();
      const updatedGap = (updated.items || []).find((i: any) => i.id === gap.id);
      expect(updatedGap.plansCount).toBe(1);
    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: clones board with preserved gap-plan links and cleans up on delete', () => {
    const board = createBoard({ title: 'Clone Links Board' }, user);
    const withItems = updateGoalItems(board.id, {
      items: [
        { title: 'CI/CD Gap', description: '', category: 'SKILL_GAP', priority: 'LOW', targetDate: '2026-06-30', weight: 50, progressPercent: 0, status: 'PENDING' },
        { title: 'GitHub Actions Deep Dive', description: '', category: 'STRATEGIC_PLAN', priority: 'LOW', targetDate: '2026-09-30', weight: 50, progressPercent: 0, status: 'PENDING' },
      ],
    }, user);
    const gap = withItems.items?.find(i => i.category === 'SKILL_GAP')!;
    const plan = withItems.items?.find(i => i.category === 'STRATEGIC_PLAN')!;

    // Link gap & plan
    toggleGapPlanLink(board.id, gap.id, plan.id, user);

    // Clone board
    const cloned = cloneBoard(board.id, user);
    const clonedGap = cloned.items?.find(i => i.category === 'SKILL_GAP')!;
    const clonedPlan = cloned.items?.find(i => i.category === 'STRATEGIC_PLAN')!;

    expect(clonedGap.plansCount).toBe(1);
    expect(clonedPlan.linkedGaps?.length).toBe(1);

    // Delete board
    const delRes = deleteBoard(cloned.id, user.orgId!, user);
    expect(delRes.success).toBe(true);
  });
});
