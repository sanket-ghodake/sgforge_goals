/**
 * @forge-apps/goals - Tier 1 Unit: Goal Center State Machine & Server-Side Lock Rigor
 * 3A Pattern (Arrange, Act, Assert) Testing Suite
 * @requirements [HLR-GOALS-001] [LLR-GOALS-001] [LLR-GOALS-002]
 */

import { describe, expect, it } from 'bun:test';
import { createBoard, createProjectRecord, getBoardById, submitBoard, updateGoalItems } from '../../src/backend/services/board-service';
import { approveBoard, requestRework } from '../../src/backend/services/review-service';
import type { AuthUser } from '../../src/lib/types';

describe('Tier 1 Unit: Goal Board State Machine & Lock Lifecycle', () => {
  const testUser: AuthUser = {
    id: `usr_tester_${Date.now()}`,
    email: 'tester@forge.internal',
    displayName: 'Test Engineer',
    roles: ['roles/employee'],
    orgId: 'org_test_unit',
  };

  const managerUser: AuthUser = {
    id: 'usr_manager_unit',
    email: 'lead@forge.internal',
    displayName: 'Team Lead',
    roles: ['roles/manager'],
    orgId: 'org_test_unit',
  };

  const testProject = createProjectRecord({
    name: 'Unit Test Project',
    code: 'UNIT',
    description: 'Dynamic project for state machine testing',
    managerId: managerUser.id,
    orgId: 'org_test_unit',
  });

  it('Arrange, Act, Assert: creates board in DRAFT status with initial lock_version=1', () => {
    // Arrange
    const input = {
      projectId: testProject.id,
      title: 'Unit Test Flight Plan',
      cycle: '2026-Q1',
    };

    // Act
    const board = createBoard(input, testUser);

    // Assert
    expect(board.id).toBeDefined();
    expect(board.status).toBe('DRAFT');
    expect(board.lockVersion).toBe(1);
    expect(board.revisionNumber).toBe(1);
    expect(board.items?.length).toBeGreaterThan(0);
  });

  it('Arrange, Act, Assert: rejects submission when total weight does not equal 100%', () => {
    // Arrange
    const board = createBoard({
      projectId: testProject.id,
      title: 'Weight Validation Plan',
      cycle: '2026-Q1',
    }, testUser);

    // Act & Assert: Set weight to 80% and attempt submit
    updateGoalItems(board.id, {
      items: [{
        title: 'Partial Milestone',
        description: 'Under-weighted',
        category: 'DELIVERABLE',
        targetDate: '2026-03-31',
        weight: 80,
        progressPercent: 0,
        status: 'PENDING',
      }],
    }, testUser);

    expect(() => submitBoard(board.id, testUser)).toThrow(/Total milestone weight must equal 100%/);
  });

  it('Arrange, Act, Assert: locks board upon submission and rejects mutations with 423 Locked', () => {
    // Arrange: Create board with valid 100% weight
    const board = createBoard({
      projectId: testProject.id,
      title: 'Lock Test Plan',
      cycle: '2026-Q1',
    }, testUser);

    updateGoalItems(board.id, {
      items: [
        {
          title: 'Milestone 1',
          description: '50% weight',
          category: 'DELIVERABLE',
          targetDate: '2026-03-31',
          weight: 50,
          progressPercent: 0,
          status: 'PENDING',
        },
        {
          title: 'Milestone 2',
          description: '50% weight',
          category: 'METRIC',
          targetDate: '2026-03-31',
          weight: 50,
          progressPercent: 0,
          status: 'PENDING',
        },
      ],
    }, testUser);

    // Act: Submit board
    const submitted = submitBoard(board.id, testUser);
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.submittedAt).toBeDefined();

    // Assert: Attempting to edit while SUBMITTED throws 423 locked error
    expect(() => updateGoalItems(board.id, {
      items: [{
        title: 'Tamper Milestone',
        description: 'Should fail',
        category: 'DELIVERABLE',
        targetDate: '2026-03-31',
        weight: 100,
        progressPercent: 0,
        status: 'PENDING',
      }],
    }, testUser)).toThrow(/locked against modifications/);
  });

  it('Arrange, Act, Assert: executes complete review, rework, resubmit, and approval lifecycle', () => {
    // 1. Arrange & Submit
    const board = createBoard({
      projectId: testProject.id,
      title: 'Full Lifecycle Plan',
      cycle: '2026-Q1',
    }, testUser);
    submitBoard(board.id, testUser);

    // 2. Manager requests rework
    const reworkBoard = requestRework(board.id, managerUser, 'Please add concrete SLO numbers to goal #1.');
    expect(reworkBoard.status).toBe('REWORK_REQUESTED');
    expect(reworkBoard.revisionNumber).toBe(2);

    // 3. User can now edit again and resubmit
    updateGoalItems(board.id, {
      items: [{
        title: 'Revised Milestone with SLO 99.9%',
        description: 'Updated per manager review notes',
        category: 'METRIC',
        targetDate: '2026-03-31',
        weight: 100,
        progressPercent: 0,
        status: 'PENDING',
      }],
    }, testUser);

    const resubmitted = submitBoard(board.id, testUser);
    expect(resubmitted.status).toBe('SUBMITTED');

    // 4. Manager approves board
    const approved = approveBoard(board.id, managerUser, 'Excellent update. Approved.');
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedBy).toContain('Team Lead');

    // 5. Assert permanent lock on approved board
    expect(() => updateGoalItems(board.id, {
      items: [{
        title: 'Post-Approval Tamper',
        description: 'Should be rejected',
        category: 'DELIVERABLE',
        targetDate: '2026-03-31',
        weight: 100,
        progressPercent: 0,
        status: 'PENDING',
      }],
    }, testUser)).toThrow(/approved and sealed/);
  });

  it('Arrange, Act, Assert: handles submission gracefully when employee has no assigned manager', () => {
    // Arrange: User with no manager assigned
    const unmanagedUser: AuthUser = {
      id: `usr_solo_${Date.now()}`,
      email: 'solo@forge.internal',
      displayName: 'Solo Contributor',
      roles: ['roles/employee'],
      orgId: 'org_test_unit',
      managerId: null,
      managerName: null,
      managerEmail: null,
    };

    const board = createBoard({
      projectId: testProject.id,
      title: 'Solo Unmanaged Plan',
      cycle: '2026-Q1',
    }, unmanagedUser);

    // Act
    const submitted = submitBoard(board.id, unmanagedUser);

    // Assert
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.submittedAt).toBeDefined();
    // Verify system audit comment added for unmanaged submission
    const refreshed = getBoardById(board.id, 'org_test_unit');
    const comments = refreshed.comments || [];
    expect(comments.some(c => c.commentText.includes('routed for Admin review') || c.commentText.includes('no assigned manager'))).toBeTrue();
  });
});
