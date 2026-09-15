# HLR-GOALS-001: Autonomous Microservice Baseline Specification

> **High-Level Requirement (HLR)** | Status: `VERIFIED` | Traceability ID: `[HLR-GOALS-001]`

---

## 1. Overview & Capability
Every autonomous Forge App scaffolded from the SG Forge template operates as a self-contained, polyglot microservice. It must execute independently inside its container environment, maintaining its own dedicated Turso SQLite database with zero cross-app database queries.

## 2. Invariants & Responsibilities
1. **Dedicated Database Isolation**: Connects exclusively to `./data/<app-name>.db` in WAL mode via `bun:sqlite` or libSQL driver.
2. **Autonomous Documentation Engine**: Exposes `/docs` and `/docs/api` endpoints for offline architecture and OpenAPI 3.1 inspection.
3. **Dual-Probe SRE Health Engine**: Implements `/health` providing livez, readyz, memory footprint, uptime, and database status.
4. **Isolated Observability**: Logs structured JSON events to colocated `logs/` directory with automated PII and credential redaction.

## 3. Downstream Traceability
- **Low-Level Requirements**:
  - `[LLR-GOALS-001]`: Dual-Probe Health & Readiness Contract
  - `[LLR-GOALS-002]`: Dedicated SQLite libSQL Instance Handler
- **Verification Suites**:
  - `test/contracts/health-schema.test.ts`
  - `test/unit/template.test.ts`
