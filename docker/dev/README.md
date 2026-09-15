# Goals Micro-App - Development Container Configuration

This directory contains the development container specifications for `@forge-apps/goals`.

## Features
- **Hot-Reloading**: Runs `bun --watch src/server.ts` for rapid local feedback.
- **Air-Gapped Network**: Uses `goals-airgap-net` (`internal: true`) for multi-tenant isolation.
- **Volume Mounts**: Live syncs `src/`, `data/`, and `logs/`.

## Usage
```bash
docker compose -f docker/dev/docker-compose.yml up --build -d
```
