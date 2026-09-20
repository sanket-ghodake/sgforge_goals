# HLR-GOALS-002: User Journeys, Manager Clearance & Scoped Visibility

> **High-Level Requirement (HLR)** | Status: `VERIFIED` | Traceability ID: `[HLR-GOALS-002]`

---

## 1. Overview & Capability
The Individual Goal Center manages end-to-end individual performance goal workflows spanning five primary personas and automated engines: Individual Contributors (Goal Owners), Direct Managers (Reviewers), Leadership / Cross-Functional Observers, System Automation Engines, and DevOps Operators. The system must enforce strict role-scoped visibility, air-gapped privacy, and mathematical milestone balancing across all journeys.

---

## 2. Invariants & Responsibilities

1. **Clearance Verification Invariant**: Access to the manager workspace and review actions requires verified leadership clearance either via Central Directory (`isManager` API), direct leadership roles (`roles/manager`, `roles/admin`, `roles/super_admin`), or local subordinate reporting lines.
2. **Segregation of Duties Invariant**: A manager is strictly forbidden from reviewing, approving, or requesting rework on their own goal board (`assertManagerOrAdmin`).
3. **Air-Gapped Privacy Redaction Invariant**: Third-party observers viewing an organization board outside their direct management hierarchy shall strictly see committed milestone deliverables and progress percentages, with zero visibility into private managerial feedback, rework justification, or audit comments.
4. **Mathematical Weight Sum Invariant**: Every goal board requires that milestone item weights sum to exactly 100% before submission is authorized.
5. **State-Locked Edit Mutability Invariant**: Milestone items cannot be altered once a board enters `SUBMITTED`, `APPROVED`, or `LOCKED_OVERDUE` states without an explicit rework or unlock transition.

---

## 3. Downstream Traceability

- **Low-Level Requirements**:
  - `[LLR-GOALS-003]`: Multi-Role Journey API Implementation & Transitions
  - `[LLR-GOALS-004]`: Milestone Weight Balancing & Mutability Assertion
- **Verification Suites**:
  - `test/unit/board-service.test.ts`
  - `test/unit/review-lifecycle.test.ts`
  - `test/security/auth-guard.test.ts`
  - `test/contracts/health-schema.test.ts`
