#!/usr/bin/env bun
/**
 * Atomic Worklog Appender for Autonomous Submodule
 * Enterprise Clean Architecture (2026 LTS Baseline)
 *
 * Appends a strictly-formatted single-line task completion entry to logs/WORKLOGS.md.
 * Format: `YYYY-MM-DD HH:mm | <brief summary>`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const APP_ROOT = process.cwd();
const LOGS_DIR = join(APP_ROOT, 'logs');
const WORKLOGS_PATH = join(LOGS_DIR, 'WORKLOGS.md');

export function appendWorklog(summary: string): void {
  if (!summary || summary.trim().length === 0) {
    console.error('❌ Error: Summary message is required to append to WORKLOGS.md');
    process.exit(1);
  }

  const cleanSummary = summary.trim().replace(/[\r\n]+/g, ' ');
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const timestampStr = `${year}-${month}-${day} ${hours}:${mins}`;

  if (!existsSync(LOGS_DIR)) {
    mkdirSync(LOGS_DIR, { recursive: true });
  }

  let existing = '';
  if (existsSync(WORKLOGS_PATH)) {
    existing = readFileSync(WORKLOGS_PATH, 'utf8').trim();
  }

  if (!existing) {
    existing = '# WORKLOGS';
  }

  const newEntry = `${timestampStr} | ${cleanSummary}`;

  if (existing.endsWith(newEntry)) {
    console.log(`ℹ️ [Worklog] Entry already logged: ${newEntry}`);
    return;
  }

  const updatedContent = `${existing}\n${newEntry}\n`;
  writeFileSync(WORKLOGS_PATH, updatedContent, 'utf8');

  console.log(`\n📜 [Worklog Updated] Appended to logs/WORKLOGS.md:`);
  console.log(`   └─ ${newEntry}\n`);
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const message = args.join(' ');
  appendWorklog(message);
}
