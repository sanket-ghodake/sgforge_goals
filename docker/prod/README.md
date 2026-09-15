# Goals Micro-App - Production Container Configuration

This directory contains production-hardened container specifications for `@forge-apps/goals`.

## Features
- **AOT Minified Bundle**: Serves single `dist/server.js` binary without source code leakage.
- **Non-Root Execution**: Runs as unprivileged `bun` user.
- **Strict Air-Gap**: Operates on isolated bridge network with zero outbound egress.

## Usage
```bash
docker compose -f docker/prod/docker-compose.yml up --build -d
```
