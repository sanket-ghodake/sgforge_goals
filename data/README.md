# 💾 Local Database Storage (`data/`)

Dedicated Turso (libSQL / SQLite) database instance for this microservice.

---

## 🔒 Multi-Tenant Isolation Invariant
- Every Forge micro-app maintains an isolated database in WAL mode.
- Micro-apps MUST NEVER query or connect to databases belonging to other applications.
- Transients (`*.db`, `*.db-wal`, `*.db-shm`) are excluded from Git via `.gitignore`.
