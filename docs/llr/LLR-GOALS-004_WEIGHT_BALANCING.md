# LLR-GOALS-004: Milestone Weight Balancing & Mutability Assertion

> **Low-Level Requirement (LLR)** | Status: `VERIFIED` | Traceability ID: `[LLR-GOALS-004]`

---

## 1. Specification
The board service shall assert that all goal items belonging to an individual goal board sum to exactly 100% weight, and shall reject mutations to milestone items whenever the board is locked in `SUBMITTED`, `APPROVED`, or `LOCKED_OVERDUE` states.

---

## 2. Mathematical Invariant & Logic Contracts

### Weight Sum Constraint
$$\sum_{i=1}^{N} \text{item.weight}_i = 100 \quad \text{where } \text{item.weight}_i \in \mathbb{Z}^+ \text{ and } 1 \le \text{item.weight}_i \le 100$$

If the computed sum $\neq 100$, the function `updateGoalItems` throws `ValidationError`:
```json
{
  "type": "https://forge.internal/errors/invalid-weight-sum",
  "title": "Validation Error",
  "status": 400,
  "detail": "Milestone weights must sum to exactly 100% (currently X%).",
  "code": "INVALID_WEIGHT_SUM"
}
```

### Mutability Assertion (`assertBoardMutable`)
A board is considered mutable if and only if:
$$\text{status} \in \{\text{'DRAFT'}, \text{'REWORK\_REQUESTED'}\}$$
If `status` $\notin \{\text{'DRAFT'}, \text{'REWORK\_REQUESTED'}\}$, `assertBoardMutable` throws `BoardLockedError` (HTTP 423) or `ForbiddenError` (HTTP 403).

---

## 3. Algorithmic Steps

1. Parse items payload in `updateGoalItems`.
2. Compute total weight: `const totalWeight = items.reduce((acc, it) => acc + (it.weight || 0), 0)`.
3. If `totalWeight !== 100`, abort with `ValidationError`.
4. Fetch existing board record; assert ownership and mutability via `assertBoardMutable`.
5. Execute item replacement within `goalsDb.transaction`:
   - Delete existing `goal_items` for `board_id`.
   - Insert new `goal_items` with sanitized sort order and progress.
   - Update `goal_boards.updated_at`.
6. Return updated board with hydrated items.

---

## 4. Traceability Links

- **Parent HLR**: `[HLR-GOALS-002]`
- **Implementation**: `src/backend/services/board-service.ts` (`updateGoalItems`, `assertBoardMutable`)
- **Verification**: `test/unit/board-service.test.ts`
