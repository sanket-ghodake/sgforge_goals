# LLR-GOALS-005: Observability, Distributed Tracing & Blast Radius Telemetry Specification

> **SG Forge Micro-App Submodule - Low-Level Requirement (2026 LTS)**
> Parent HLR: `HLR-SDK-301` | Submodule: `@forge-apps/goals` | Traceability Code: `LLR-GOALS-005`

---

## 1. Requirement Scope & Objective

The Individual Goal Center must implement Tech-Giant Grade Observability across both Development and Production environments. The system must provide deterministic request correlation, wide canonical JSON access logging, client-side Real User Monitoring (RUM), and an automated user blast radius incident triage capability.

---

## 2. Technical Invariants & Functional Contracts

### 2.1 Distributed Tracing & Context Propagation
1. **Trace Extraction**: Ingress requests must inspect `X-Trace-Id` and W3C `traceparent` headers.
   - If present, the trace identifier must be extracted and preserved throughout the entire request lifecycle.
   - If missing, the server must deterministically generate an internal identifier: `trace_${Date.now()}_${entropy}`.
2. **Response Header Injection**: Every HTTP response (including static 200 OK, 302 redirects, and RFC 7807 problem details) must return:
   - `X-Trace-Id: <traceId>`
   - `traceparent: 00-<traceId>-0000000000000001-01`
3. **Downstream Query Correlation**: Database queries, external directory lookups, and operational logs must carry the ambient `traceId`.

### 2.2 Wide Canonical Request Logging
1. For every non-noise HTTP transaction, the server must emit exactly one canonical structured NDJSON event containing:
   - `timestamp`: ISO-8601 UTC timestamp.
   - `service`: `goals`.
   - `type`: `CANONICAL_REQUEST`.
   - `env`: Current runtime environment (`development` | `production` | `test`).
   - `traceId`: Active request trace ID.
   - `method`: HTTP method (`GET`, `POST`, `PUT`, `DELETE`).
   - `path`: Request pathname.
   - `status`: HTTP response status code.
   - `durationMs`: Wall-clock execution time in milliseconds.
   - `userId`: Authenticated user ID (or `undefined` if unauthenticated).
   - `orgId`: Multi-tenant organization identifier.
2. **Static & Health Exclusions**: `/assets/*` and `/health` requests are excluded from disk write amplification to preserve high throughput.

### 2.3 Dev vs. Prod Environment Matrix
1. **Development (`NODE_ENV=development`)**:
   - Logs dual-written: human-readable formatted console line + structured JSON in `logs/goals.log`.
   - RFC 7807 problem details include developer error messages for rapid local debugging.
2. **Production (`NODE_ENV=production`)**:
   - Pure structured NDJSON written to stdout (for container collectors) and `logs/goals.log`.
   - Strict PII redaction: Bearer tokens, passwords, cookies, and sensitive headers are recursively replaced with `[REDACTED]`.
   - RFC 7807 problem responses suppress internal stack traces and raw SQL errors; only sanitized titles and the opaque `traceId` are visible to clients.

### 2.4 Browser RUM & Telemetry Bridge (`POST /api/logs/browser`)
1. The frontend must maintain a circular breadcrumb buffer (up to 10 user interactions: clicks, navigation, modal states).
2. Global `window.onerror` and `unhandledrejection` events must automatically forward diagnostic payloads to `/api/logs/browser`.
3. Ingested client events must be written to `logs/goals.log` with `BROWSER` tags, client IP, and the associated session/trace ID.

### 2.5 Blast Radius & Incident Triage Engine (`./run.sh blast-radius`)
1. The repository must supply an offline, air-gapped CLI (`scripts/ops/blast-radius.ts`) to analyze `logs/goals.log`.
2. The engine must compute:
   - Total requests, unique active users, and status code distribution.
   - **Smooth Journeys**: Percentage and count of users who completed operations with zero errors.
   - **Impacted Users**: Exact user IDs, affected endpoints, failure codes, and sample trace IDs.
   - **SLO Verification**: Automated verification against the $99.9\%$ uptime and zero-5xx standard.

---

## 3. Verification & Compliance Criteria

1. **Unit Verification**: `test/unit/observability.test.ts` validates trace extraction, recursive redaction, canonical log format, and blast radius calculations.
2. **End-to-End Verification**: `test/e2e/playwright-journeys.test.ts` executes automated headless Chrome journeys verifying custom UI components, telemetry bridge submission, and RFC 7807 trace headers.
3. **Static Audit**: Gate 19 of `./run.sh verify` validates 100% of telemetry exports against `@requirements [LLR-GOALS-005]`.
