# Individual Goal Center Documentation Portal (`docs/`)

> **Autonomous Microservice Documentation Suite** | **SG Forge Clean Architecture (2026 LTS)**
> In-App Living Documentation Engine: `http://localhost:8090/docs` | OpenAPI 3.1 Contract Explorer: `http://localhost:8090/docs/api`

---

## 1. Executive Summary & Purpose

The **Individual Goal Center (`@forge-apps/goals`)** is an autonomous micro-app providing version-locked goal setting, mathematical milestone balancing, managerial review workflows, and air-gapped organizational visibility.

This documentation suite captures system architecture, end-to-end user journeys, relational data models, state machines, formal requirements, and operational procedures.

---

## 2. Documentation Directory Map

```
docs/
├── README.md                                # Central documentation gateway (this file)
├── architecture/
│   ├── system-architecture.md               # Clean Architecture layers & component breakdown
│   ├── data-models-and-state-machine.md     # SQLite schemas, ERD, and state machine transitions
│   └── observability-and-testing.md         # Tech-giant observability, blast radius & 5-tier testing
├── journeys/
│   ├── contributor-journey.md               # Journey 1: Contributor formulation & execution
│   ├── manager-review-journey.md            # Journey 2: Manager review drawer & approval sign-off
│   ├── leadership-explore-journey.md        # Journey 3: Leadership explore & privacy redaction
│   ├── system-lifecycle-journey.md          # Journey 4: Concurrency, deadlines & reminder engine
│   └── developer-operator-journey.md        # Journey 5: Local dev, 5-tier testing & operations
├── hlr/                                     # High-Level Requirements (System Specifications)
│   ├── HLR-GOALS-001_MICROSERVICE_BASELINE.md
│   ├── HLR-GOALS-002_USER_JOURNEYS.md
│   └── review-lifecycle-hlr.md
├── llr/                                     # Low-Level Requirements (Contract Specifications)
│   ├── LLR-GOALS-001_HEALTH_PROBE_CONTRACT.md
│   ├── LLR-GOALS-002_DATABASE_HANDLER.md
│   ├── LLR-GOALS-003_JOURNEY_IMPLEMENTATION.md
│   ├── LLR-GOALS-004_WEIGHT_BALANCING.md
│   ├── LLR-GOALS-005_OBSERVABILITY_TELEMETRY.md
│   └── review-lifecycle-llr.md
└── api/
    └── openapi.yaml                         # Comprehensive OpenAPI 3.1 Contract Specification
```

---

## 3. End-to-End User Journeys

1. **[Contributor Journey](file:///home/sanket/Desktop/Sanket/forge-app/goals/docs/journeys/contributor-journey.md)**:
   - Zero-trust authentication and Central Directory profile sync.
   - Goal board formulation and project linkage.
   - Mathematical milestone weight balancing (weights must sum to 100%).
   - Review submission and immutable board locking.
   - Responding to rework requests and updating execution progress.
2. **[Manager Review Journey](file:///home/sanket/Desktop/Sanket/forge-app/goals/docs/journeys/manager-review-journey.md)**:
   - Leadership and managerial clearance verification.
   - Scoped review queue triage across reporting lines.
   - Interactive review drawer with line-item milestone comments.
   - Formal approval sign-off with approver signature stamping.
   - Rework request rejections and setting submission deadlines.
3. **[Leadership & Observer Journey](file:///home/sanket/Desktop/Sanket/forge-app/goals/docs/journeys/leadership-explore-journey.md)**:
   - Organization-wide goal discovery across departments.
   - Air-gapped privacy redaction cloaking internal manager feedback and draft status churn.
   - Clean alignment projection of committed milestones and progress scores.
4. **[System Lifecycle Journey](file:///home/sanket/Desktop/Sanket/forge-app/goals/docs/journeys/system-lifecycle-journey.md)**:
   - Automated deadline enforcement transitioning overdue boards to `LOCKED_OVERDUE`.
   - Concurrency versioning (`lock_version`, `revision_number`).
   - Reminder notification dispatch and dismissal mechanics.
   - Central Directory profile caching with offline partition tolerance.
5. **[Developer & Operator Journey](file:///home/sanket/Desktop/Sanket/forge-app/goals/docs/journeys/developer-operator-journey.md)**:
   - Zero-install setup with portable Bun (`./run.sh setup`).
   - 5-Tier microservice testing suite (`./run.sh test`).
   - 19-Check pre-commit verification gate (`./run.sh verify`).
   - Atomic database backups (`./run.sh backup`) and disaster recovery.

---

## 4. Technical Architecture & Data Models

- **[System Architecture](file:///home/sanket/Desktop/Sanket/forge-app/goals/docs/architecture/system-architecture.md)**:
  Detailed explanation of the 5 Clean Architecture horizontal layers, submodule autonomy, zero-trust session validation, and directory integration.
- **[Data Models & State Machine](file:///home/sanket/Desktop/Sanket/forge-app/goals/docs/architecture/data-models-and-state-machine.md)**:
  Entity-Relationship Diagram, table definitions (`users`, `projects`, `goal_boards`, `goal_items`, `review_comments`, `reminders`), query optimization indexes, and state machine transitions.

---

## 5. Traceability & Requirements Standards

The repository maintains strict traceability linking requirements to code:
- **High-Level Requirements**: Located in `docs/hlr/`. Defines business capabilities and invariants.
- **Low-Level Requirements**: Located in `docs/llr/`. Defines API contracts, schemas, and algorithmic steps.
- **Code-Level Tags**: Exported symbols in `src/` carry `@requirements [HLR-...] [LLR-...]` TSDoc annotations.
- **Automated Verification**: Gate 19 of `./run.sh verify` audits 100% of exported symbols for active requirement mappings.

---

## 6. Toolchain & Knowledge Graph

- **Graphify Knowledge Graph**:
  - Run `./portables/bin/graphify` to generate `graphify-out/graph.html`, `graphify-out/graph.json`, and `graphify-out/GRAPH_REPORT.md`.
- **Graft Symbol Caller Maps**:
  - Colocated symbol cards under `graft/`, queryable via `./run.sh graft callers <symbol>` or `./run.sh graft skeleton <file>`.
- **Living Documentation Hub**:
  - Start the interactive viewer via `./run.sh docs:dev` and open `http://localhost:8090/docs`.
- **Contract Linting**:
  - Validate OpenAPI contracts via `./run.sh contracts`.
