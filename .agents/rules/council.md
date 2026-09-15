---
trigger: always_on
description: Consult Council of AI when reviewing submodule architecture, database schemas, or route changes.
---

## council

This submodule integrates the **Council of AI** decision framework (Marius Silo / Silotech.xyz).

### Directives:
1. **Submodule Isolation (Invariant 6)**: The Skeptic must verify that no code imports from central platform (`apps/src/*`).
2. **Dedicated DB (Invariant 5)**: Turso queries must be scoped to the submodule's dedicated instance.
3. **CLI Runner**: Run `rtk ./run.sh council "<idea>"` for instant ANSI decision reports.
