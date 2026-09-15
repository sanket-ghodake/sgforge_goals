# LLR-GOALS-002: Dedicated SQLite libSQL Instance Handler

> **Low-Level Requirement (LLR)** | Status: `VERIFIED` | Traceability ID: `[LLR-GOALS-002]`

---

## 1. Specification
The database initialization layer shall open a dedicated SQLite database located in `data/<app-name>.db` using Write-Ahead Logging (WAL) and busy timeout configurations.

## 2. Invariants & Security Boundaries
1. **Zero Central Queries**: Must not read or write any databases in `apps/data/` or other submodule directories.
2. **Atomic Transactions**: Mutations must execute within atomic transaction blocks.
3. **WAL Enforcement**: PRAGMA journal_mode=WAL must be active upon connection bootstrap.

## 3. Traceability Links
- **Parent HLR**: `[HLR-GOALS-001]`
- **Implementation**: `src/db/index.ts`
- **Verification**: `test/unit/template.test.ts`
