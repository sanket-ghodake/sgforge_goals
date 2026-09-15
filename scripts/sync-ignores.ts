#!/usr/bin/env bun
/**
 * Standalone Forge Micro-App - Ignore & Git Attributes Synchronization Script (2026 LTS)
 * Ensures consistency across .gitignore, .dockerignore, .antigravityignore, .cursorignore,
 * .copilotignore, .graftignore, .graphifyignore, .repomixignore, and .gitattributes.
 */

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const APP_ROOT = join(import.meta.dir, '..');

const IGNORE_PATTERNS = `# Dependencies & Package Managers
node_modules/
dist/
build/
out/
.cache/
portables/**/cache/
*.tsbuildinfo

# Submodule Environment & Secrets
.env
.env.*
!.env.example
*.pem
*.key
*.crt

# Submodule Local Database & Transients
data/*.db
data/*.db-wal
data/*.db-shm
data/*.sqlite
data/*.sqlite3
backups/db/*
!backups/db/README.md

# Submodule Local Logs (transient logs ignored; ledgers and worklogs tracked)
logs/*.log
logs/*.jsonl.bak
logs/token-ledger-backup.jsonl
logs/council/
logs/security/
logs/reports/
.agents/reports/

# AI Context, Token & Compression Tooling
.graftignore
/graft/
.codeburn/
codeburn-*.json
.headroom/
headroom-*.json
graphify-out/cache/
graphify-out/.graphify_*
repomix-output.xml

# Operating System & IDE Transients
.DS_Store
Thumbs.db
.idea/
*.swp
`;

const DOCKER_IGNORE_PATTERNS = `.git
.agents
.githooks
.github
node_modules
test
logs
data
.env
.env.*
!.env.example
/graft
.codeburn
.headroom
`;

const GIT_ATTRIBUTES_CONTENT = `* text=auto eol=lf
*.ts text eol=lf
*.js text eol=lf
*.json text eol=lf
*.jsonl text eol=lf
*.md text eol=lf
*.sh text eol=lf
*.bat text eol=crlf
*.cmd text eol=crlf
*.yml text eol=lf
*.yaml text eol=lf
*.png binary
*.jpg binary
*.jpeg binary
*.ico binary
*.svg text eol=lf
*.db binary
*.db-shm binary
*.db-wal binary
`;

const IGNORE_TARGETS = [
  '.gitignore',
  '.antigravityignore',
  '.cursorignore',
  '.copilotignore',
  '.graftignore',
  '.graphifyignore',
  '.repomixignore',
];

for (const target of IGNORE_TARGETS) {
  writeFileSync(join(APP_ROOT, target), IGNORE_PATTERNS, 'utf8');
}

writeFileSync(join(APP_ROOT, '.dockerignore'), DOCKER_IGNORE_PATTERNS, 'utf8');
writeFileSync(join(APP_ROOT, '.gitattributes'), GIT_ATTRIBUTES_CONTENT, 'utf8');

console.log('✨ [Submodule Sync] Synchronized ignore files and .gitattributes successfully.');
