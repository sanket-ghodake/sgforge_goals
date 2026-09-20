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
  managerId?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;
  jobTitle?: string | null;
  employeeCode?: string | null;
  hasManagerAbove?: boolean;
  directReportsCount?: number;
  subordinateManagersCount?: number;
  isManagerInDirectory?: boolean;
}

export interface UserRow {
  id: string;
  email: string;
  display_name: string;
  roles: string;
  department: string;
  manager_id?: string | null;
  manager_name?: string | null;
  manager_email?: string | null;
  job_title?: string | null;
  employee_code?: string | null;
  created_at: number;
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

export interface EmployeeManagerCheckResponse {
  status: 'SUCCESS' | 'ERROR';
  userId: string;
  isManager: boolean;
  directReportsCount: number;
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

export type GoalBoardStatus = 'DRAFT' | 'SUBMITTED' | 'REWORK_REQUESTED' | 'APPROVED' | 'LOCKED_OVERDUE' | 'UNLOCK_REQUESTED' | 'COMPLETED' | 'ARCHIVED';

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
  managerId?: string | null;
  managerName?: string | null;
  title: string;
  cycle: string;
  status: GoalBoardStatus;
  lockVersion: number;
  revisionNumber: number;
  submissionDeadline?: string | null;
  submittedAt?: number | null;
  approvedAt?: number | null;
  approvedBy?: string | null;
  unlockedAt?: number | null;
  createdAt: number;
  updatedAt: number;
  items?: GoalItem[];
  comments?: ReviewComment[];
}

export type ReviewCommentType = 'FEEDBACK' | 'REWORK_REQUEST' | 'APPROVAL_NOTE' | 'UNLOCK_REQUEST' | 'DEADLINE_SET' | 'UNLOCKED' | 'SUBMISSION' | 'BOARD_CREATED';

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

export type ReminderType = 'SUBMISSION_DUE' | 'PENDING_APPROVAL' | 'REWORK_REQUIRED' | 'UNLOCK_REQUESTED' | 'FEEDBACK_RECEIVED' | 'BOARD_APPROVED' | 'BOARD_UNLOCKED';

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
  submissionDeadline?: string;
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
  decision: 'APPROVE' | 'REWORK' | 'UNLOCK' | 'REQUEST_UNLOCK' | 'SET_DEADLINE';
  comment?: string;
  itemId?: string;
  deadline?: string;
}

// -----------------------------------------------------------------------------
// Database Row Interfaces for Type-Safe SQLite Queries
// -----------------------------------------------------------------------------

export interface ProjectRow {
  id: string;
  org_id: string;
  name: string;
  code: string;
  description: string;
  manager_id: string;
  created_at: number;
}

export interface GoalBoardRow {
  id: string;
  org_id: string;
  project_id: string;
  project_name?: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  owner_department: string;
  title: string;
  cycle: string;
  status: GoalBoardStatus;
  lock_version: number;
  revision_number: number;
  submission_deadline?: string | null;
  submitted_at?: number | null;
  approved_at?: number | null;
  approved_by?: string | null;
  unlocked_at?: number | null;
  created_at: number;
  updated_at: number;
}

export interface GoalItemRow {
  id: string;
  board_id: string;
  title: string;
  description: string;
  category: GoalCategory;
  target_date: string;
  weight: number;
  progress_percent: number;
  status: GoalItemStatus;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export interface GoalReviewRow {
  id: string;
  board_id: string;
  item_id?: string | null;
  author_id: string;
  author_name: string;
  author_role: string;
  comment_text: string;
  type: ReviewCommentType;
  created_at: number;
}

export interface ReminderRow {
  id: string;
  org_id: string;
  user_id: string;
  board_id: string;
  type: ReminderType;
  message: string;
  due_date?: string | null;
  is_dismissed: number;
  created_at: number;
}

