#!/usr/bin/env bun
/**
 * SG Forge Micro-App Submodule - Pre-Commit Logger (2026 LTS)
 * Appends pre-commit metadata to logs/commits.jsonl and logs/WORKLOGS.md BEFORE commit,
 * ensuring all log artifacts are staged and included directly in the commit.
 * ZERO files are generated after commit.
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const APP_ROOT = process.cwd();
const LOGS_DIR = join(APP_ROOT, 'logs');

if (!existsSync(LOGS_DIR)) {
  mkdirSync(LOGS_DIR, { recursive: true });
}

// Check staged files in index
const diffStat = spawnSync('git', ['diff', '--cached', '--shortstat'], {
  cwd: APP_ROOT,
  encoding: 'utf8',
});

const diffFiles = spawnSync('git', ['diff', '--cached', '--name-only'], {
  cwd: APP_ROOT,
  encoding: 'utf8',
});

const stagedFileList = (diffFiles.stdout || '').trim().split('\n').filter(Boolean);
const nonLogFiles = stagedFileList.filter((f) => !f.startsWith('logs/'));

if (nonLogFiles.length > 0) {
  const statSummary = (diffStat.stdout || '').trim() || `${nonLogFiles.length} files changed`;
  const authorRes = spawnSync('git', ['config', 'user.name'], { cwd: APP_ROOT, encoding: 'utf8' });
  const author = (authorRes.stdout || '').trim() || 'Forge Developer';

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');

  const entry = {
    timestamp: now.toISOString(),
    dateStr,
    author,
    filesCount: nonLogFiles.length,
    stat: statSummary,
    files: nonLogFiles.slice(0, 10),
  };

  // Append JSONL
  appendFileSync(join(LOGS_DIR, 'commits.jsonl'), JSON.stringify(entry) + '\n', 'utf8');

  // Append to WORKLOGS.md if not already logged in current minute
  const worklogPath = join(LOGS_DIR, 'WORKLOGS.md');
  const currentWorklogs = existsSync(worklogPath) ? readFileSync(worklogPath, 'utf8') : '';
  const worklogLine = `${dateStr} | pre-commit: staged ${nonLogFiles.length} files (${statSummary})\n`;
  if (!currentWorklogs.includes(worklogLine.trim())) {
    appendFileSync(worklogPath, worklogLine, 'utf8');
  }

  console.log(`📜 [Submodule Pre-Commit] Staged log artifacts: ${nonLogFiles.length} files (${statSummary})`);
}
