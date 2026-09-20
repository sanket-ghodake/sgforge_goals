# Goals Micro-App - Source Directory (`src/`)

This directory houses the core application code for `@forge-apps/goals`, organized into clear tier boundaries:

- [`frontend/`](./frontend): SPA views, templates, and styling.
- [`backend/`](./backend): Domain services, state machines, and business logic.
- [`db/`](./db): Dedicated Turso libSQL ORM connection and schema definitions.
- [`lib/`](./lib): Shared portable 4-library UI engine, icons, and type definitions.
- [`server.ts`](./server.ts): HTTP dispatcher and server bootstrap entrypoint.
