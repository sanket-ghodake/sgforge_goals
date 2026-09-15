# Micro-App Scaffold Template Test Suite (`@forge/app-template`)

This directory houses the comprehensive **5-Tier Test Architecture** boilerplate for newly scaffolded micro-apps.

---

## 🏛️ Test Tiers & Governance

| Tier | Category | Location | Purpose & Scenarios |
| :--- | :--- | :--- | :--- |
| **Tier 1** | **Unit** | `unit/` | Core domain unit tests. |
| **Tier 2** | **Integration** | `integration/` | Database & inter-service integration tests. |
| **Tier 3** | **Security** | `security/` | Multi-tenant isolation and input security tests. |
| **Tier 4** | **Contracts** | `contracts/` | RFC 7807 and dual-probe schema validation. |
| **Tier 5** | **E2E** | `e2e/` | Full micro-app server bootstrap and Astryx UI tests. |

---

## 🚀 Running Tests

```bash
# Run all App Template tests
rtk bun test forge-apps/app-template/test
```
