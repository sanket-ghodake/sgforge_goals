# LLR-GOALS-001: Dual-Probe Health & Readiness Contract

> **Low-Level Requirement (LLR)** | Status: `VERIFIED` | Traceability ID: `[LLR-GOALS-001]`

---

## 1. Specification
The microservice HTTP server shall expose a `/health` endpoint responding with HTTP 200 OK containing structured JSON telemetry for automated SRE health monitoring.

## 2. Response Schema & Invariants
```json
{
  "status": "ok",
  "app": "goals",
  "port": 8099,
  "livez": true,
  "readyz": true,
  "memoryMb": 34.2,
  "db": "template.db",
  "uptime": 12.4,
  "timestamp": "2026-09-15T10:00:00.000Z"
}
```

## 3. Algorithmic Steps
1. Parse incoming request path; check for equality with `/health` or suffix matching.
2. Measure process resident memory via `process.memoryUsage().rss`.
3. Check libSQL database connectivity file descriptor.
4. Return HTTP 200 with `application/json` content-type header.

## 4. Traceability Links
- **Parent HLR**: `[HLR-GOALS-001]`
- **Implementation**: `src/server.ts`
- **Verification**: `test/contracts/health-schema.test.ts`
