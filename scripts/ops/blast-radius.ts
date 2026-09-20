#!/usr/bin/env bun
/**
 * SG Forge Micro-App Submodule - Blast Radius & Incident Triage CLI (2026 LTS)
 * Parses logs/goals.log to answer:
 * 1. Which users faced which errors?
 * 2. What percentage of journeys completed smoothly?
 * 3. What is the root cause and active trace IDs for incident triage?
 * Supports --env dev|prod, --window 15m|1h|24h, --user <id>, --json
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBlastRadius } from '../../src/lib/telemetry';

const REPO_ROOT = join(import.meta.dir, '../..');
const LOG_FILE = process.env.LOG_FILE || join(REPO_ROOT, 'logs', 'goals.log');

function parseArgs() {
  const args = process.argv.slice(2);
  let envFilter: 'development' | 'production' | 'test' | 'all' = 'all';
  let windowMinutes = 60;
  let userFilter: string | null = null;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--env' && args[i + 1]) {
      const val = args[++i].toLowerCase();
      if (val === 'dev' || val === 'development') envFilter = 'development';
      else if (val === 'prod' || val === 'production') envFilter = 'production';
      else if (val === 'test') envFilter = 'test';
    } else if ((arg === '--window' || arg === '-w') && args[i + 1]) {
      const val = args[++i];
      if (val.endsWith('m')) windowMinutes = parseInt(val, 10);
      else if (val.endsWith('h')) windowMinutes = parseInt(val, 10) * 60;
      else if (val.endsWith('d')) windowMinutes = parseInt(val, 10) * 1440;
      else windowMinutes = parseInt(val, 10) || 60;
    } else if ((arg === '--user' || arg === '-u') && args[i + 1]) {
      userFilter = args[++i];
    } else if (arg === '--json') {
      jsonOutput = true;
    }
  }

  return { envFilter, windowMinutes, userFilter, jsonOutput };
}

function run() {
  const { envFilter, windowMinutes, userFilter, jsonOutput } = parseArgs();

  if (!existsSync(LOG_FILE)) {
    if (jsonOutput) {
      console.log(JSON.stringify({ error: `Log file not found: ${LOG_FILE}`, totalRequests: 0 }));
    } else {
      console.log(`⚠️ Log file not found at ${LOG_FILE}. No requests recorded yet.`);
    }
    process.exit(0);
  }

  const logContent = readFileSync(LOG_FILE, 'utf8');
  const report = parseBlastRadius(logContent, {
    envFilter,
    windowMs: windowMinutes * 60 * 1000,
  });

  if (userFilter) {
    report.impactedUsers = report.impactedUsers.filter((u) => u.userId === userFilter);
    report.impactedJourneysCount = report.impactedUsers.length;
  }

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('\n' + '='.repeat(80));
  console.log('🚨 [SG FORGE] OBSERVABILITY & USER BLAST RADIUS TRIAGE');
  console.log('='.repeat(80));
  console.log(`⏱️  Time Window:    Last ${windowMinutes} minutes`);
  console.log(`🌐 Environment:    ${envFilter.toUpperCase()}`);
  console.log(`📊 Total Requests: ${report.totalRequests}`);
  console.log(`👥 Unique Users:   ${report.totalUniqueUsers}`);
  console.log(`✨ Smooth Journeys: ${report.smoothJourneysPercent}% (${report.smoothJourneysCount} users with zero errors)`);
  console.log(`💥 Impacted Users: ${report.impactedJourneysCount}`);
  console.log(`🛡️  SLO Status:     ${report.sloMet ? '✅ 99.9% TARGET MET' : '❌ SLO BREACHED (< 99.9%)'}\n`);

  console.log('--- Status Code Distribution ---');
  for (const [code, count] of Object.entries(report.statusBreakdown)) {
    const isError = Number(code) >= 400;
    console.log(`  ${isError ? '🔴' : '🟢'} HTTP ${code.padEnd(4)}: ${count} requests`);
  }

  if (Object.keys(report.errorBreakdown).length > 0) {
    console.log('\n--- Error Code Breakdown ---');
    for (const [errCode, count] of Object.entries(report.errorBreakdown)) {
      console.log(`  ⚠️  ${errCode.padEnd(25)}: ${count} occurrences`);
    }
  }

  if (report.impactedUsers.length > 0) {
    console.log('\n--- Impacted Users Details (Blast Radius) ---');
    for (const user of report.impactedUsers) {
      console.log(`\n👤 User ID: ${user.userId}`);
      console.log(`   ├─ Errors Encountered: ${user.errorCount}`);
      console.log(`   ├─ Error Code:         ${user.errorCode}`);
      console.log(`   ├─ Last Message:       ${user.lastError}`);
      console.log(`   ├─ Affected Routes:    ${user.affectedRoutes.join(', ')}`);
      console.log(`   └─ Sample Trace IDs:   ${user.traceIds.join(', ')}`);
    }
  } else {
    console.log('\n🎉 No users impacted by errors in the selected window!');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

run();
