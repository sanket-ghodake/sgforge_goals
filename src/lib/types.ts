/**
 * SG Forge Micro-App Submodule - Standalone Type Definitions (2026 LTS)
 * 100% Isolated: Zero imports from central platform monorepo.
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [HLR-GOALS-001]
 */

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  principalType?: string;
  department?: string;
  orgId?: string;
}

export interface AuthGuardOptions {
  appName?: string;
  appId?: string;
  requiredRoles?: string[];
  publicPaths?: string[];
  redirectTo?: string;
}

export interface AuthGuardResult {
  authenticated: boolean;
  user?: AuthUser;
  response?: Response;
}

export interface ScopedHierarchyResponse {
  employee?: {
    id: string;
    displayName: string;
    email: string;
    departmentName: string;
  };
  managementChain?: Array<{
    id: string;
    displayName: string;
    email: string;
    roleTitle: string;
  }>;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  traceId: string;
  timestamp: string;
}

// -----------------------------------------------------------------------------
// Individual Goal Center Domain Types (Enterprise 2026 LTS)
// -----------------------------------------------------------------------------

export interface Project {
  id: string;
  orgId: string;
  name: string;
  code: string;
  description: string;
  managerId: string;
  createdAt: number;
}

export type GoalBoardStatus = 'DRAFT' | 'SUBMITTED' | 'REWORK_REQUESTED' | 'APPROVED' | 'ARCHIVED';

export type GoalCategory = 'DELIVERABLE' | 'METRIC' | 'LEARNING';

export type GoalItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface GoalItem {
  id: string;
  boardId: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetDate: string;
  weight: number;
  progressPercent: number;
  status: GoalItemStatus;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface GoalBoard {
  id: string;
  orgId: string;
  projectId: string;
  projectName?: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerDepartment: string;
  title: string;
  cycle: string;
  status: GoalBoardStatus;
  lockVersion: number;
  revisionNumber: number;
  submittedAt?: number | null;
  approvedAt?: number | null;
  approvedBy?: string | null;
  createdAt: number;
  updatedAt: number;
  items?: GoalItem[];
  comments?: ReviewComment[];
}

export type ReviewCommentType = 'FEEDBACK' | 'REWORK_REQUEST' | 'APPROVAL_NOTE';

export interface ReviewComment {
  id: string;
  boardId: string;
  itemId?: string | null;
  authorId: string;
  authorName: string;
  authorRole: string;
  commentText: string;
  type: ReviewCommentType;
  createdAt: number;
}

export type ReminderType = 'SUBMISSION_DUE' | 'PENDING_APPROVAL' | 'REWORK_REQUIRED';

export interface Reminder {
  id: string;
  orgId: string;
  userId: string;
  boardId: string;
  type: ReminderType;
  message: string;
  dueDate?: string | null;
  isDismissed: number;
  createdAt: number;
}

export interface CreateBoardInput {
  projectId: string;
  title: string;
  cycle: string;
}

export interface UpdateGoalItemsInput {
  items: Array<{
    id?: string;
    title: string;
    description: string;
    category: GoalCategory;
    targetDate: string;
    weight: number;
    progressPercent: number;
    status: GoalItemStatus;
  }>;
}

export interface ReviewBoardInput {
  decision: 'APPROVE' | 'REWORK';
  comment: string;
  itemId?: string;
}
