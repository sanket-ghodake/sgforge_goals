# Goals Micro-App - Database Layer (`src/db/`)

Houses the dedicated Turso (libSQL) database driver and schema migrations for `@forge-apps/goals`.

- `index.ts`: Initializes local SQLite database connection (`goals.db`), executes DDL table creation, and seeds baseline project datasets.
