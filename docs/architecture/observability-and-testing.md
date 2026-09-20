# Tech-Giant Grade Observability, Triage & Testing Architecture

> **Individual Goal Center (`@forge-apps/goals`) | SG Forge Clean Architecture (2026 LTS)**
> In-App Portal: `http://localhost:8090/docs` | Triage CLI: `./run.sh blast-radius` | Test Runner: `./run.sh test`

---

## 1. Executive Summary & Industry Standard

In mission-critical enterprise systems (Google, Meta, Netflix, Stripe, Uber), **observability is not a passive stream of arbitrary print statements**. Instead, observability is structured around four fundamental pillars:

1. **Wide Canonical Log Events**: Emitting a single, high-cardinality JSON record per request that captures all dimensions (user ID, tenant, route, status, duration, error code).
2. **Distributed Tracing & Context Propagation**: Maintaining an unbroken trace context (`X-Trace-Id`, W3C `traceparent`) from browser interaction, across the gateway, through domain services, down to database transactions.
3. **User Blast Radius Accounting**: Quantifying exact user impact in real time—answering *who was impacted*, *which journeys completed smoothly*, and *what was the root cause*.
4. **Client Real User Monitoring (RUM) & Breadcrumbs**: Transparently capturing client-side exceptions, unhandled rejections, and user interaction breadcrumbs, streaming them to the server telemetry bridge.

---

## 2. End-to-End Observability Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│  • Astryx Design System (Zero Emojis, Zero Native OS Defaults)              │
│  • RUM Breadcrumb Buffer (Captures last 10 clicks, navigations, modals)     │
│  • Telemetry Hook: window.onerror & window.unhandledrejection               │
│  • RFC 7807 Modal with Tactile "Copy Trace ID" Button                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / X-Trace-Id / W3C traceparent
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INDIVIDUAL GOAL CENTER HTTP SERVICE                      │
│  • createSafeHandler (RFC 7807 Error Boundary & Canonical Logger)           │
│  • extractOrGenerateTraceId (Preserves caller trace or creates trace_...)   │
│  • Telemetry Ingestion Bridge: POST /api/logs/browser                       │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼                                     ▼
        ┌───────────────────────┐             ┌───────────────────────┐
        │  Turso libSQL Database│             │    logs/goals.log     │
        │  • WAL Mode           │             │  • Canonical Requests │
        │  • Query Latency Logs │             │  • Browser Telemetry  │
        │  • PRAGMA Optimization│             │  • RFC 7807 Errors    │
        └───────────────────────┘             └───────────┬───────────┘
                                                          │
                                                          ▼
                                              ┌───────────────────────┐
                                              │  ./run.sh blast-radius│
                                              │  • Impacted Users     │
                                              │  • Smooth Journeys %  │
                                              │  • 99.9% SLO Gate     │
                                              └───────────────────────┘
```

---

## 3. Dev vs. Prod Environment Matrix

The Individual Goal Center dynamically tunes its observability and security boundaries based on the active runtime environment:

| Feature / Dimension | Development (`NODE_ENV=development`) | Production (`NODE_ENV=production`) |
| :--- | :--- | :--- |
| **Log Output Channel** | Dual-write: Formatted console output + NDJSON file append to `logs/goals.log`. | Pure structured NDJSON to stdout (ready for Docker `json-file` / Vector) and `logs/goals.log`. |
| **RFC 7807 Problem Detail** | Rich developer hints and exact exception messages included in `detail` field. | Strict redaction: Raw stack traces and database schemas are suppressed. Only sanitized titles and opaque `traceId` returned. |
| **PII & Credential Scrubbing** | Tokens masked in logs. | Deep recursive redaction: Bearer tokens, passwords, cookies, and secret keys stripped to `[REDACTED]`. |
| **Distributed Tracing** | `X-Trace-Id` + W3C `traceparent` stamped on all response headers. | `X-Trace-Id` + W3C `traceparent` stamped on all response headers. |
| **Session Authentication** | Asymmetric Ed25519 with backward-compatible HMAC dev secret fallback. | Strict asymmetric Ed25519 signature validation against Central Auth public key. |
| **Database Isolation** | Local SQLite (`data/goals.db`) with WAL mode and fast dev seeding (`./run.sh seed`). | Local libSQL (`data/goals.db`) with WAL mode, 600 file permissions, hourly snapshot daemon. |
| **Network Governance** | Port `8090` exposed for local dev access. | Strict air-gapped container (`internal: true`) routed exclusively through Central Forge Gateway. |

---

## 4. Wide Canonical Log Schema

Every completed HTTP request produces a single canonical log entry in `logs/goals.log`:

```json
{
  "timestamp": "2026-09-20T14:30:00.000Z",
  "service": "goals",
  "level": "INFO",
  "type": "CANONICAL_REQUEST",
  "env": "production",
  "traceId": "trace_1789913990889_qxelq",
  "method": "POST",
  "path": "/api/boards/board_101/review",
  "status": 200,
  "durationMs": 6.11,
  "userId": "usr-alex-mgr",
  "orgId": "org-phoenix"
}
```

### Key Dimensions:
* `traceId`: Globally unique request identifier passed to client and downstream systems.
* `durationMs`: Wall-clock execution time for SLA and latency outlier detection.
* `userId` & `orgId`: Identifies the exact tenant and actor without logging sensitive PII.
* `status`: Response status code used for automated blast radius aggregation.

---

## 5. Incident Triage Playbook: Blast Radius Analysis

When an alert fires or system degraded states are reported, on-call operators triage the incident in under 60 seconds using `./run.sh blast-radius`:

### Command Usage:
```bash
# Default triage for last 60 minutes
./run.sh blast-radius

# Filter by environment and time window
./run.sh blast-radius --env prod --window 15m

# Filter by specific impacted user
./run.sh blast-radius --user usr-alice-eng

# Machine-readable JSON output for automated post-mortems
./run.sh blast-radius --json
```

### Sample Triage Output:
```
================================================================================
🚨 [SG FORGE] OBSERVABILITY & USER BLAST RADIUS TRIAGE
================================================================================
⏱️  Time Window:    Last 60 minutes
🌐 Environment:    PRODUCTION
📊 Total Requests: 1420
👥 Unique Users:   84
✨ Smooth Journeys: 99.93% (83 users with zero errors)
💥 Impacted Users: 1
🛡️  SLO Status:     ✅ 99.9% TARGET MET

--- Status Code Distribution ---
  🟢 HTTP 200 : 1380 requests
  🟢 HTTP 201 : 39 requests
  🔴 HTTP 400 : 1 requests

--- Error Code Breakdown ---
  ⚠️  VALIDATION_ERROR         : 1 occurrences

--- Impacted Users Details (Blast Radius) ---
👤 User ID: usr-alice-eng
   ├─ Errors Encountered: 1
   ├─ Error Code:         VALIDATION_ERROR
   ├─ Last Message:       Project ID and Board Title are required.
   ├─ Affected Routes:    /api/boards
   └─ Sample Trace IDs:   trace_1789913990889_qxelq
================================================================================
```

---

## 6. 5-Tier Automated Testing Governance

Testing in the Individual Goal Center follows strict 5-Tier Clean Architecture test governance:

1. **Tier 1 (Unit Tests - `test/unit/`)**:
   - Pure domain logic, state machine transitions, milestone weight balancing mathematics, and telemetry utilities (`test/unit/observability.test.ts`).
2. **Tier 2 (Integration Tests - `test/integration/`)**:
   - REST API endpoints, database operations, canonical log emissions, and health probes (`test/integration/api-routes.test.ts`).
3. **Tier 3 (Security Tests - `test/security/`)**:
   - Zero-Trust JWT verification, Ed25519 asymmetric signatures, RBAC manager clearance, and multi-tenant isolation (`test/security/auth-gate.test.ts`).
4. **Tier 4 (Contract Tests - `test/contracts/`)**:
   - OpenAPI 3.1 specification linting via Spectral, RFC 7807 problem details schema, and health probe contracts (`test/contracts/health-schema.test.ts`).
5. **Tier 5 (E2E Journeys - `test/e2e/`)**:
   - End-to-end user journeys using headless Google Chrome (`test/e2e/playwright-journeys.test.ts` and `test/e2e/team-reviews-journeys.test.ts`), validating client-side hydration, zero browser defaults, and real-time telemetry submission.
