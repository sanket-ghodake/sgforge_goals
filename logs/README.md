# 📜 Isolated Microservice Logs & Ledgers

This directory contains the local, isolated runtime logs, task worklogs, and persistent lifetime token ledgers for this microservice.

## Files & Roles
- **`app.log`**: Backend server execution logs, HTTP routes, latencies, and RFC 7807 error problem details.
- **`browser.log`**: Client-side browser console errors, warnings, and unhandled window rejections.
- **`db.log`**: Turso libSQL/SQLite query executions, transaction commits, and slow query warnings ($>10\text{ms}$).
- **`docker.log`**: Container stdout/stderr lifecycle and crash records.
- **`WORKLOGS.md`**: Single-line per-task conversation worklog (`YYYY-MM-DD HH:mm | <summary>`).
- **`commits.jsonl`**: Ground-truth commit metadata ledger populated by Git hooks.
- **`token-ledger.jsonl`**: Permanent Git-tracked AI token and spend ledger (persisted across machine migrations).

## Rotation & Retention Policy
- Max file size: 5 MB per log file (`*.log`).
- Rolling backups: Maximum 3 files (`*.log`, `*.log.1`, `*.log.2`).
- Total directory cap: $\le 25\text{ MB}$.
- Ledgers (`*.jsonl`, `WORKLOGS.md`) are permanent Git artifacts and are never automatically purged.
