# People Manager & Reviewer Journey Specification

> **Document Type**: User Journey Architecture | **Target Actor**: People Manager / Department Lead / Reviewer | **Traceability**: `[HLR-GOALS-002]`, `[LLR-GOALS-004]`

---

## 1. Journey Overview & Review Governance

The Manager Review Journey governs the inspection, feedback cycle, formal sign-off, and administrative management of goal boards submitted by reporting employees. Key governance rules include:
- **Segregation of Duties**: A manager cannot approve or rework their own goal board (`assertManagerOrAdmin`).
- **Clearance Verification**: Access to the manager workspace requires verified managerial clearance either via Central Directory (`isManager` API), direct leadership roles (`roles/manager`, `roles/admin`), or local subordinate reporting lines.
- **Granular Line-Item Feedback**: Managers can comment on specific deliverables or the overall board to guide rework iterations.
- **Audit Signature Sealing**: Approvals affix the reviewer's display name, role/title, and timestamp, permanently sealing the revision record.

---

## 2. End-to-End Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Manager as People Manager (Sarah)
    participant UI as Team Reviews (team-reviews-list.ts)
    participant Drawer as Review Drawer (review-drawer.ts)
    participant Server as Microservice Server (server.ts)
    participant ReviewSvc as Review Service (review-service.ts)
    participant DB as Dedicated Turso DB (data/goals.db)
    actor Contributor as Direct Report (Alex)

    Note over Manager,UI: Phase 1: Clearance & Review Triage
    Manager->>UI: Navigates to "Reviews" Tab
    UI->>Server: GET /api/boards (orgId filter)
    Server->>DB: Query SUBMITTED boards under Sarah's hierarchy
    Server-->>UI: 200 OK [ { boardId: "gb_alex", status: "SUBMITTED" } ]
    UI->>UI: Render Team Review Queue with submitted timestamps

    Note over Manager,Drawer: Phase 2: Inspection & Line-Item Comments
    Manager->>UI: Clicks "Review Board" for Alex
    UI->>Drawer: Open Slide-Over Drawer for gb_alex
    Manager->>Drawer: Adds inline comment on Milestone 2: "Specify p99 latency target"
    Drawer->>Server: POST /api/boards/:id/comments
    Server->>ReviewSvc: addReviewComment(boardId, Sarah, commentText, itemId)
    ReviewSvc->>DB: INSERT INTO review_comments (type = 'FEEDBACK')
    Server-->>Drawer: 200 OK (Rendered in Feedback Timeline)

    Note over Manager,Server: Phase 3A: Decision - Request Rework
    alt Manager Requests Changes
        Manager->>Drawer: Clicks "Request Rework" with summary note
        Drawer->>Server: POST /api/boards/:id/review { decision: 'REWORK', comment: "..." }
        Server->>ReviewSvc: requestRework(boardId, Sarah, commentText)
        ReviewSvc->>DB: UPDATE goal_boards SET status = 'REWORK_REQUESTED', rev = rev + 1
        ReviewSvc->>DB: INSERT INTO review_comments (type = 'REWORK_REQUEST')
        ReviewSvc->>DB: INSERT INTO reminders (type = 'REWORK_REQUIRED', user_id = Alex.id)
        Server-->>Drawer: 200 OK (Board unlocked for Alex, Rev 2 initiated)
    else Phase 3B: Decision - Formal Approval
        Manager->>Drawer: Clicks "Approve Goal Board" with commendation note
        Drawer->>Server: POST /api/boards/:id/review { decision: 'APPROVE', comment: "..." }
        Server->>ReviewSvc: approveBoard(boardId, Sarah, commentText)
        ReviewSvc->>DB: UPDATE goal_boards SET status = 'APPROVED', approved_at = now, approved_by = 'Sarah (Director)'
        ReviewSvc->>DB: INSERT INTO review_comments (type = 'APPROVAL_NOTE')
        ReviewSvc->>DB: INSERT INTO reminders (type = 'BOARD_APPROVED', user_id = Alex.id)
        Server-->>Drawer: 200 OK (Board permanently sealed)
    end

    Note over Manager,Server: Phase 4: Administrative Governance (Deadlines & Unlocks)
    opt Set Hard Submission Deadline
        Manager->>Drawer: Sets Deadline: "2026-03-31"
        Drawer->>Server: POST /api/boards/:id/review { decision: 'SET_DEADLINE', deadline: "2026-03-31" }
        Server->>ReviewSvc: setSubmissionDeadline(boardId, Sarah, "2026-03-31")
        ReviewSvc->>DB: UPDATE goal_boards SET submission_deadline = "2026-03-31"
        Server-->>Drawer: 200 OK
    end
```

---

## 3. Step-by-Step Functional Journey

### Step 1: Managerial Clearance Verification
1. When a user accesses `/` with `tab=reviews`, `server.ts` invokes the Manager Clearance Guard:
   - Check 1: Does `auth.user.roles` contain `roles/manager`, `roles/admin`, or `roles/super_admin`?
   - Check 2: If false, query Central Directory: `GET /api/v1/auth/hierarchy/:id/is-manager`.
   - Check 3: If Central Directory is unreachable, query local SQLite: `isLocalManager(userId)`.
2. If verified, the user is authorized. If unverified, the server returns HTTP 403 with `FORBIDDEN_MANAGER_ONLY` and renders the Astryx Leadership Restricted View.

### Step 2: Team Reviews Dashboard
1. The **Reviews** tab displays all boards currently in `SUBMITTED`, `REWORK_REQUESTED`, and `UNLOCK_REQUESTED` statuses within the manager's reporting scope.
2. The UI calculates days elapsed since submission to highlight urgent reviews.
3. Search and filtering controls allow narrowing by cycle, employee name, or department.

### Step 3: Interactive Review Drawer & Audit Comments
1. Clicking **Review Board** opens the glassmorphic `ReviewDrawer` component without navigating away from the page.
2. The drawer presents:
   - Contributor header: Name, department, job title, and submission revision number.
   - Milestone cards: Title, category, weight, and delivery target.
   - Interactive feedback thread: Enables entering review comments tagged directly to an individual milestone or to the overall board.
3. Every comment creates an immutable row in `review_comments` with the author's identity and timestamp.

### Step 4: Approval Sign-Off & Rework Rejections
1. **Rework Request**:
   - Requires a non-empty explanation comment.
   - Sets status to `REWORK_REQUESTED`.
   - Increments `revision_number` ($R_{k+1} = R_k + 1$) and `lock_version`.
   - Generates a `REWORK_REQUIRED` reminder for the contributor.
   - Automatically dismisses previous `PENDING_APPROVAL` reminders.
2. **Approval Sign-Off**:
   - Sets status to `APPROVED`.
   - Records `approved_at` timestamp and `approved_by` electronic signature (e.g. `"Sarah Smith (Engineering Director)"`).
   - Generates a `BOARD_APPROVED` notification for the contributor.

### Step 5: Setting Deadlines & Unlocking Approved Boards
1. **Submission Deadlines**: Managers can define a cutoff date (`submission_deadline`). If a contributor fails to submit by this date, the system auto-locks the board in `LOCKED_OVERDUE`.
2. **Emergency Unlock**: If an approved board requires milestone adjustments due to organizational restructuring, the manager can issue an explicit `UNLOCK` decision, returning the board to `REWORK_REQUESTED` for revisions.

---

## 4. Error Handling & Security Invariants

| Scenario | HTTP Status | RFC 7807 Error Code | System Action |
| :--- | :--- | :--- | :--- |
| Manager attempts to review own board | 403 Forbidden | `FORBIDDEN_SELF_REVIEW` | Segregation of duties violation; rejects operation |
| Non-manager attempts review endpoint | 403 Forbidden | `FORBIDDEN_MANAGER_ONLY` | Denies execution; returns problem detail |
| Review decision without explanation on rework | 400 Bad Request | `MISSING_REWORK_COMMENT` | Validation failure; prompts for feedback text |
| Approval attempted on non-submitted board | 400 Bad Request | `INVALID_STATUS_TRANSITION` | Rejects transition; enforces state machine rules |
