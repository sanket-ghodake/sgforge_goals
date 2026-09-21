/**
 * @forge-apps/goals/test/integration - Review Comment Reflection & Logging Integration Tests (Tier 2)
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001] [LLR-GOALS-002] [HLR-SDK-301]
 */

import { describe, expect, it } from 'bun:test';
import { createInternalServiceToken } from '../../src/lib/sdk';
import { startgoalsServer } from '../../src/server';

describe('Tier 2 Integration: Review Comment Sync & Telemetry Logging', () => {
  it('Arrange, Act, Assert: reviewer message reflects in contributor review pane and generates in-app reminder', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const baseUrl = `http://localhost:${server.port}`;

    const contributorId = `usr_contrib_${Date.now()}`;
    const contributorToken = createInternalServiceToken(['roles/manager'], contributorId);

    const reviewerId = `usr_reviewer_${Date.now()}`;
    const reviewerToken = createInternalServiceToken(['roles/admin'], reviewerId);

    try {
      // 1. Contributor creates a goal board
      const createRes = await fetch(`${baseUrl}/api/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `forge_session=${contributorToken}`,
        },
        body: JSON.stringify({
          title: 'Mission Critical Engineering Plan',
        }),
      });
      expect(createRes.status).toBe(201);
      const board = await createRes.json();
      expect(board.id).toBeDefined();

      // 2. Reviewer posts a critique comment
      const commentRes = await fetch(`${baseUrl}/api/boards/${board.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `forge_session=${reviewerToken}`,
        },
        body: JSON.stringify({
          commentText: 'Please strengthen the automated reliability test targets.',
        }),
      });
      expect(commentRes.status).toBe(200);
      const boardAfterComment = await commentRes.json();
      expect(boardAfterComment.comments).toBeDefined();
      expect(boardAfterComment.comments.length).toBeGreaterThan(0);

      // 3. Contributor retrieves the board - MUST reflect reviewer comment
      const contribFetchRes = await fetch(`${baseUrl}/api/boards/${board.id}`, {
        headers: {
          'Cookie': `forge_session=${contributorToken}`,
        },
      });
      expect(contribFetchRes.status).toBe(200);
      const contribBoard = await contribFetchRes.json();
      expect(contribBoard.comments).toBeDefined();
      expect(contribBoard.comments.length).toBeGreaterThanOrEqual(2);
      const feedbackComment = contribBoard.comments.find((c: any) => c.commentText === 'Please strengthen the automated reliability test targets.');
      expect(feedbackComment).toBeDefined();
      expect(feedbackComment.authorId).toBe(reviewerId);

      // 4. Contributor checks action alerts / reminders - MUST receive FEEDBACK_RECEIVED notification
      const remindersRes = await fetch(`${baseUrl}/api/reminders`, {
        headers: {
          'Cookie': `forge_session=${contributorToken}`,
        },
      });
      expect(remindersRes.status).toBe(200);
      const reminders = await remindersRes.json();
      expect(Array.isArray(reminders)).toBe(true);
      const feedbackReminder = reminders.find((r: any) => r.boardId === board.id && r.type === 'FEEDBACK_RECEIVED');
      expect(feedbackReminder).toBeDefined();
      expect(feedbackReminder.message).toContain('strengthen the automated reliability test');

      // 5. Contributor dismisses reminder
      const dismissRes = await fetch(`${baseUrl}/api/reminders/${feedbackReminder.id}/dismiss`, {
        method: 'POST',
        headers: {
          'Cookie': `forge_session=${contributorToken}`,
        },
      });
      expect(dismissRes.status).toBe(200);

      // Verify reminder is now dismissed
      const remindersAfterDismiss = await fetch(`${baseUrl}/api/reminders`, {
        headers: {
          'Cookie': `forge_session=${contributorToken}`,
        },
      }).then(r => r.json());
      expect(remindersAfterDismiss.some((r: any) => r.id === feedbackReminder.id)).toBe(false);

    } finally {
      server.stop(true);
    }
  });

  it('Arrange, Act, Assert: central telemetry bridge ingests browser crashes and reports status', async () => {
    // Arrange
    const server = startgoalsServer(0);
    const baseUrl = `http://localhost:${server.port}`;

    try {
      // Act: POST to /api/logs/browser with unhandled error
      const crashRes = await fetch(`${baseUrl}/api/logs/browser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'unhandledrejection',
          severity: 'ERROR',
          message: 'Unhandled Promise rejection in review timeline client',
          stack: 'Error at review-drawer.ts:250',
          url: 'http://localhost/apps/goals/?tab=board&id=board_123',
        }),
      });

      // Assert
      expect(crashRes.status).toBe(200);
      const data = await crashRes.json();
      expect(data.ok).toBe(true);

    } finally {
      server.stop(true);
    }
  });
});
