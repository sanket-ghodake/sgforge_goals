# LLR-GOALS-003: Multi-Role Journey API Implementation & Transitions

> **Low-Level Requirement (LLR)** | Status: `VERIFIED` | Traceability ID: `[LLR-GOALS-003]`

---

## 1. Specification
The microservice HTTP server and application services shall implement API endpoints and state transitions enabling contributors to formulate and submit goal boards, managers to review, comment, approve, or request rework, and observers to inspect organization goals under air-gapped privacy redaction.

---

## 2. API Endpoints & State Machine Contracts

### `POST /api/boards/:id/submit`
Transitions board from `DRAFT` or `REWORK_REQUESTED` to `SUBMITTED`.
- **Pre-Conditions**: User must be board owner; sum of item weights must equal 100%.
- **Side Effects**: Sets `submitted_at = now()`, inserts `PENDING_APPROVAL` reminder for manager.

### `POST /api/boards/:id/review`
Processes review decisions: `APPROVE`, `REWORK`, `REQUEST_UNLOCK`, `UNLOCK`, `SET_DEADLINE`.
- **Payload Schema**:
  ```json
  {
    "decision": "APPROVE | REWORK | REQUEST_UNLOCK | UNLOCK | SET_DEADLINE",
    "comment": "string (mandatory on REWORK)",
    "deadline": "YYYY-MM-DD (mandatory on SET_DEADLINE)"
  }
  ```
- **Pre-Conditions**: For `APPROVE`, `REWORK`, `UNLOCK`, user must satisfy `assertManagerOrAdmin` and must NOT be board owner.

### `POST /api/boards/:id/comments`
Appends line-item or board-level feedback to the review thread.
- **Payload Schema**:
  ```json
  {
    "commentText": "string",
    "itemId": "optional milestone item ID"
  }
  ```

---

## 3. Algorithmic Steps

1. Authenticate request via `authGuard`.
2. Extract board entity from `goalsDb`.
3. Assert access clearance and segregation of duties.
4. Execute state update, audit comment insertion, and reminder creation within an atomic database transaction (`goalsDb.transaction`).
5. Return updated `GoalBoard` entity with HTTP 200/201.

---

## 4. Traceability Links

- **Parent HLR**: `[HLR-GOALS-002]`
- **Implementation**: `src/server.ts`, `src/backend/services/review-service.ts`, `src/backend/services/board-service.ts`
- **Verification**: `test/unit/review-lifecycle.test.ts`
