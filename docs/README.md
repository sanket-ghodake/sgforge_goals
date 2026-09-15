# Forge App Template Documentation (`docs/`)

> **Autonomous Micro-App Scaffold Starter Kit**

---

## 🧭 Overview & Guidelines

When generating a new microservice via `./run.sh create-app <name>`, this template structure is cloned to ensure immediate compliance with the SG Forge Clean Architecture standards:

- **Isolated Database**: Configured for its own Turso libSQL database.
- **Independent Container**: Contains its own Dockerfile and docker-compose.yml.
- **Traceability Ready**: Starter `docs/hlr/` and `docs/llr/` directories ready for SG Forge requirement specifications.
