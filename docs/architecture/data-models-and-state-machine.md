# Data Models & State Machine Architecture

> **Document Type**: Technical Architecture Specification | **Standard**: SG Forge Clean Architecture (2026 LTS) | **Traceability**: `[HLR-GOALS-001]`, `[HLR-GOALS-002]`, `[LLR-GOALS-002]`, `[LLR-GOALS-004]`

---

## 1. Entity-Relationship Data Model

The Individual Goal Center persists all relational state inside a dedicated Turso SQLite database file (`data/goals.db`), operating in Write-Ahead Logging (WAL) mode.

```mermaid
erDiagram
    USERS ||--o{ GOAL_BOARDS : "owns"
    GOAL_BOARDS ||--|{ GOAL_ITEMS : "contains"
    GOAL_BOARDS ||--o{ REVIEW_COMMENTS : "has audit trail"
    GOAL_BOARDS ||--o{ REMINDERS : "triggers"

    USERS {
        TEXT id PK "Unique User ID (e.g. usr_123)"
        TEXT email "Corporate email address"
        TEXT display_name "Full display name"
        TEXT roles "Comma-separated role strings"
        TEXT department "Assigned business department"
        TEXT manager_id "Reporting manager User ID"
        TEXT manager_name "Reporting manager display name"
        TEXT manager_email "Reporting manager email"
        TEXT job_title "Job Title or Role designation"
        TEXT employee_code "Human Resources employee code"
        INTEGER created_at "Epoch timestamp (ms)"
    }

    PROJECTS {
        TEXT id PK "Unique Project ID (e.g. proj_123)"
        TEXT org_id "Tenant Organization ID"
        TEXT name "Project title"
        TEXT code "Project uppercase acronym/code"
        TEXT description "Project description"
        TEXT manager_id "Project Lead / Manager User ID"
        INTEGER created_at "Epoch timestamp (ms)"
    }

    GOAL_BOARDS {
        TEXT id PK "Unique Goal Board ID (e.g. gb_123)"
        TEXT org_id "Tenant Organization ID"
        TEXT owner_id FK "References users(id)"
        TEXT owner_name "Owner full name"
        TEXT owner_email "Owner email"
        TEXT owner_department "Owner department"
        TEXT title "Goal Board Title"
        TEXT status "Current lifecycle status"
        INTEGER lock_version "Optimistic concurrency version"
        INTEGER revision_number "Review cycle iteration counter"
        TEXT submission_deadline "Cutoff date (YYYY-MM-DD)"
        INTEGER submitted_at "Epoch timestamp when submitted"
        INTEGER approved_at "Epoch timestamp when approved"
        TEXT approved_by "Manager signature (Name + Title)"
        INTEGER unlocked_at "Epoch timestamp when unlocked"
        INTEGER created_at "Creation timestamp"
        INTEGER updated_at "Last update timestamp"
    }

    GOAL_ITEMS {
        TEXT id PK "Unique Milestone ID (e.g. item_123)"
        TEXT board_id FK "References goal_boards(id) ON DELETE CASCADE"
        TEXT title "Milestone title"
        TEXT description "Detailed deliverable specification"
        TEXT category "Category (DELIVERABLE, KPI, etc.)"
        TEXT target_date "Target completion date (YYYY-MM-DD)"
        INTEGER weight "Integer percentage weight (1-100)"
        INTEGER progress_percent "Execution completion percent (0-100)"
        TEXT status "Milestone status (PENDING, COMPLETED)"
        INTEGER sort_order "Display sequence order"
        INTEGER created_at "Creation timestamp"
        INTEGER updated_at "Last update timestamp"
    }

    REVIEW_COMMENTS {
        TEXT id PK "Unique Comment ID (e.g. comm_123)"
        TEXT board_id FK "References goal_boards(id) ON DELETE CASCADE"
        TEXT item_id FK "Optional reference to specific goal_items(id)"
        TEXT author_id "Author User ID"
        TEXT author_name "Author Display Name"
        TEXT author_role "Author Role / Title"
        TEXT comment_text "Feedback or rejection rationale"
        TEXT type "Comment type (FEEDBACK, REWORK_REQUEST, etc.)"
        INTEGER created_at "Creation timestamp"
    }

    REMINDERS {
        TEXT id PK "Unique Reminder ID (e.g. rem_123)"
        TEXT org_id "Tenant Organization ID"
        TEXT user_id FK "Recipient User ID"
        TEXT board_id FK "Associated goal_boards(id)"
        TEXT type "Reminder type (PENDING_APPROVAL, etc.)"
        TEXT message "Human-readable notification text"
        TEXT due_date "Optional deadline"
        INTEGER is_dismissed "0 = Active, 1 = Dismissed"
        INTEGER created_at "Creation timestamp"
    }
```

---

## 2. Finite State Machine Lifecycle Transitions

The review lifecycle is managed as a strict finite state machine:

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Board Created
    
    DRAFT --> SUBMITTED: Contributor Submits (Locks Edits)
    DRAFT --> LOCKED_OVERDUE: Submission Deadline Passes Without Submit
    
    SUBMITTED --> APPROVED: Manager Approves (Seals Board)
    SUBMITTED --> REWORK_REQUESTED: Manager Requests Changes (rev++)
    
    REWORK_REQUESTED --> SUBMITTED: Contributor Resubmits
    REWORK_REQUESTED --> LOCKED_OVERDUE: Resubmission Deadline Passes
    
    APPROVED --> REWORK_REQUESTED: Manager Reopens Board
    APPROVED --> UNLOCK_REQUESTED: Contributor Petitions for Unlock
    
    LOCKED_OVERDUE --> UNLOCK_REQUESTED: Contributor Petitions for Unlock
    LOCKED_OVERDUE --> APPROVED: Manager Overrides & Approves
    
    UNLOCK_REQUESTED --> REWORK_REQUESTED: Manager Grants Unlock
    UNLOCK_REQUESTED --> APPROVED: Manager Declines & Re-approves
```

---

## 3. Database Indexes & Query Optimizations

To guarantee low latency (<5ms) across concurrent operations:
```sql
CREATE INDEX IF NOT EXISTS idx_goal_boards_org_owner ON goal_boards(org_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_goal_items_board_id ON goal_items(board_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_board_id ON review_comments(board_id);
CREATE INDEX IF NOT EXISTS idx_reminders_org_user ON reminders(org_id, user_id, is_dismissed);
```

---

## 4. Integrity Constraints & Mathematical Invariants

1. **100% Weight Sum Invariant**:
   $$\sum_{i=1}^{N} \text{item.weight}_i = 100$$
   Enforced server-side during `updateGoalItems`. An attempt to submit items summing to $\neq 100$ aborts the transaction with `ValidationError`.
2. **Referential Cascade Invariant**:
   Foreign keys enforce `ON DELETE CASCADE` on `goal_items`, `review_comments`, and `reminders`. Deleting a parent `goal_boards` record cleans up all dependent child entities atomically.
3. **Optimistic Locking Invariant**:
   Any update to `goal_boards` increments `lock_version = lock_version + 1`. If two concurrent updates target the same record, version collision prevents overwriting.
