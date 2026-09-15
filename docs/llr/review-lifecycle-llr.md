# Low-Level Requirements (LLR): Review Conductor API Contracts & State Transitions

## Requirement Overview
- **Requirement ID**: `[LLR-GOALS-001]`, `[LLR-GOALS-002]`
- **Module**: `src/backend/services/review-service.ts`, `src/backend/services/board-service.ts`

---

## 1. Sequence Diagram: Review Approval & Rework Flow

```mermaid
sequenceDiagram
    autonumber
    actor C as Contributor (Owner)
    participant API as Server (Hono / Bun)
    participant DB as Turso libSQL DB
    actor M as Manager (Reviewer)

    C->>API: POST /api/boards/:id/submit
    API->>DB: UPDATE goal_boards SET status = 'SUBMITTED'
    API->>DB: INSERT INTO reminders (type = 'PENDING_APPROVAL')
    API-->>C: 200 OK (Board Locked)

    M->>API: POST /api/boards/:id/review { decision: 'REWORK', comment: '...' }
    API->>DB: UPDATE goal_boards SET status = 'REWORK_REQUESTED', revision_number = rev+1
    API->>DB: INSERT INTO review_comments (type = 'REWORK_REQUEST')
    API->>DB: INSERT INTO reminders (type = 'REWORK_REQUIRED')
    API-->>M: 200 OK (Board Unlocked for Contributor)

    C->>API: POST /api/boards/:id/submit
    API->>DB: UPDATE goal_boards SET status = 'SUBMITTED'
    API-->>C: 200 OK (Resubmitted)

    M->>API: POST /api/boards/:id/review { decision: 'APPROVE' }
    API->>DB: UPDATE goal_boards SET status = 'APPROVED', approved_at = now
    API-->>M: 200 OK (Board Formally Sealed)
```

---

## 2. API Endpoint Payload Specifications

### `POST /api/boards/:id/review`
Processes manager decisions and contributor unlock requests.

**Request Payload**:
```json
{
  "decision": "APPROVE | REWORK | REQUEST_UNLOCK | UNLOCK | SET_DEADLINE",
  "comment": "Optional feedback text or unlock justification",
  "deadline": "YYYY-MM-DD"
}
```

**Response Payload (`GoalBoard`)**:
```json
{
  "id": "board_123",
  "status": "APPROVED | REWORK_REQUESTED | UNLOCK_REQUESTED | LOCKED_OVERDUE",
  "revisionNumber": 2,
  "submissionDeadline": "2026-03-31",
  "lockVersion": 3
}
```

---

## 3. Server-Side Guard Assertions (`assertBoardMutable`)
- Throws `BoardLockedError` (HTTP 423) if editing is attempted on `SUBMITTED`, `APPROVED`, or `LOCKED_OVERDUE` boards.
- Throws `ForbiddenError` (HTTP 403) if non-owner attempts milestone modification.
