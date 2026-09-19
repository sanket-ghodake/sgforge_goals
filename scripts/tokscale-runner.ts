#!/usr/bin/env bun
/**
 * @forge/tokscale-runner - Repository-Scoped Tokscale Analytics & Ledger Synchronizer
 * Enterprise Clean Architecture (2026 LTS)
 *
 * Scopes AI token and spend tracking strictly to this repository and its git worktrees,
 * filtering out foreign workspaces. Supports Antigravity Desktop IDE & multi-IDE clients.
 *
 * @requirements [LLR-OBS-001] [LLR-SUB-007]
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { spawnSync } from 'node:child_process';

export interface TokscaleEntry {
  client: string; mergedClients?: string; workspaceKey: string; workspaceLabel: string;
  model: string; provider: string; input: number; output: number;
  cacheRead: number; cacheWrite: number; reasoning: number; messageCount: number; cost: number;
}

export interface TokscaleReport {
  groupBy: string; entries: TokscaleEntry[];
  totalInput: number; totalOutput: number; totalCacheRead: number;
  totalCacheWrite: number; totalMessages: number; totalCost: number; processingTimeMs: number;
}

export interface TokenLedgerEntry {
  timestamp: string; sessionId: string; tool: string; model: string;
  inputTokens: number; outputTokens: number; cachedTokens: number;
  reasoningTokens?: number; messages?: number; costUsd: number;
  gitCommit: string; summary: string;
}

const LEDGER_PATH = join(process.cwd(), 'logs', 'token-ledger.jsonl');

export function getLedgerKey(tool: string, model: string): string {
  return `${tool.toLowerCase().trim()}::${model.toLowerCase().trim()}`;
}

/**
 * Get known paths and labels for the current repository and any git worktrees.
 */
export function getRepoWorkspaces(baseDir = process.cwd()): { paths: string[]; labels: string[] } {
  const paths = new Set<string>();
  const labels = new Set<string>();

  const absRoot = resolve(baseDir);
  paths.add(absRoot);
  labels.add(basename(absRoot));

  const baseName = basename(absRoot);
  const normalizedBase = baseName.replace(/_clone$/, '').replace(/-clone$/, '');
  labels.add(normalizedBase);

  try {
    const gitOut = spawnSync('git', ['worktree', 'list', '--porcelain'], {
      cwd: baseDir,
      encoding: 'utf-8',
    });
    if (gitOut.status === 0 && gitOut.stdout) {
      const lines = gitOut.stdout.split('\n');
      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          const wtPath = resolve(line.substring(9).trim());
          paths.add(wtPath);
          labels.add(basename(wtPath));
        }
      }
    }
  } catch {
    // Ignore git error
  }

  return { paths: Array.from(paths), labels: Array.from(labels) };
}

/**
 * Filter tokscale entries strictly to the target repository workspace.
 */
export function filterEntriesByWorkspace(
  entries: TokscaleEntry[],
  workspaces = getRepoWorkspaces()
): TokscaleEntry[] {
  return entries.filter((entry) => {
    // Exclude unassigned workspaces or raw antigravity entries (which are accurately resolved by loadAntigravityDesktopSessions)
    if (entry.client === 'antigravity') return false;
    if (!entry.workspaceKey || entry.workspaceLabel === 'Unknown workspace') return false;

    const entryPath = resolve(entry.workspaceKey);
    const entryLabel = entry.workspaceLabel || basename(entryPath);

    for (const p of workspaces.paths) {
      if (entryPath === p || entryPath.startsWith(p + '/')) return true;
    }

    for (const l of workspaces.labels) {
      if (
        entryLabel === l ||
        entryLabel.startsWith(l + '-') ||
        entryLabel.startsWith(l + '_') ||
        entryPath.includes(`/${l}/`) ||
        entryPath.endsWith(`/${l}`)
      ) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Fetch raw Tokscale analytics JSON using portable Bun.
 */
export function fetchRawTokscaleReport(): TokscaleReport | null {
  const portableBun = join(process.cwd(), 'portables', 'bun', 'bin', 'bun');
  const bunExec = existsSync(portableBun) ? portableBun : 'bun';

  const cleanPath = (process.env.PATH || '')
    .split(':')
    .filter((p) => !p.includes('/portables/bin'))
    .join(':');

  try {
    const res = spawnSync(bunExec, ['x', '@tokscale/cli', '--json', '--group-by', 'workspace,model'], {
      encoding: 'utf-8',
      env: { ...process.env, PATH: cleanPath, DO_NOT_TRACK: '1', TOKSCALE_NO_TELEMETRY: '1' },
      maxBuffer: 10 * 1024 * 1024,
    });

    if (res.status === 0 && res.stdout) {
      const jsonStart = res.stdout.indexOf('{');
      if (jsonStart !== -1) {
        return JSON.parse(res.stdout.substring(jsonStart)) as TokscaleReport;
      }
    }
  } catch (err) {
    console.error('⚠️ [tokscale-runner] Failed to run tokscale CLI:', err);
  }

  return null;
}

/**
 * Ingest Antigravity Desktop IDE live sessions and resolve workspace mapping.
 */
export function loadAntigravityDesktopSessions(workspaces = getRepoWorkspaces()): TokscaleEntry[] {
  const home = process.env.HOME || '/home/sanket';
  const sessionsDir = join(home, '.config', 'tokscale', 'antigravity-cache', 'sessions');
  const convDir = join(home, '.gemini', 'antigravity-ide', 'conversations');

  if (!existsSync(sessionsDir) || !existsSync(convDir)) return [];

  let Database: any;
  try {
    Database = require('bun:sqlite').Database;
  } catch {
    return [];
  }

  const files = readdirSync(sessionsDir).filter((f) => f.endsWith('.jsonl'));
  const modelStats: Record<string, TokscaleEntry> = {};

  for (const f of files) {
    const convId = f.slice(0, 36);
    const dbPath = join(convDir, `${convId}.db`);
    let isMatch = false;

    if (existsSync(dbPath)) {
      try {
        const db = new Database(dbPath, { readonly: true });
        const row = db.query('SELECT data FROM trajectory_metadata_blob WHERE id = "main"').get() as { data?: Uint8Array } | null;
        if (row?.data) {
          const str = Buffer.from(row.data).toString('utf-8');
          isMatch = workspaces.paths.some((p) => str.includes(p)) || workspaces.labels.some((l) => str.includes(l));
        }
      } catch {}
    }

    if (!isMatch) continue;

    try {
      const content = readFileSync(join(sessionsDir, f), 'utf-8');
      for (const line of content.split('\n')) {
        if (!line) continue;
        const item = JSON.parse(line);
        if (item.type === 'usage') {
          let m = item.modelId || 'gemini-3.8-flash';
          if (m.startsWith('MODEL_PLACEHOLDER')) m = 'gemini-3.8-flash';
          if (!modelStats[m]) {
            modelStats[m] = {
              client: 'Antigravity IDE',
              workspaceKey: process.cwd(),
              workspaceLabel: workspaces.labels[0] || 'org_website_clone',
              model: m,
              provider: m.includes('claude') ? 'anthropic' : 'google',
              input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, messageCount: 0, cost: 0,
            };
          }
          modelStats[m].input += item.input || 0;
          modelStats[m].output += item.output || 0;
          modelStats[m].cacheRead += item.cacheRead || 0;
          modelStats[m].reasoning += item.reasoning || 0;
          modelStats[m].messageCount += 1;
        }
      }
    } catch {}
  }

  for (const entry of Object.values(modelStats)) {
    const isClaude = entry.model.includes('claude');
    const r = isClaude ? { i: 3.0, o: 15.0, c: 0.30 } : { i: 0.15, o: 0.60, c: 0.0375 };
    entry.cost = (entry.input * r.i + entry.output * r.o + entry.cacheRead * r.c) / 1_000_000;
  }

  return Object.values(modelStats);
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return n.toLocaleString();
}

export function readLedger(ledgerPath = LEDGER_PATH): TokenLedgerEntry[] {
  if (!existsSync(ledgerPath)) return [];
  const lines = readFileSync(ledgerPath, 'utf-8').split('\n').filter(Boolean);
  const entries: TokenLedgerEntry[] = [];
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {}
  }
  return entries;
}

export function syncTokensToLedger(
  liveEntries: TokscaleEntry[],
  ledgerPath = LEDGER_PATH
): TokenLedgerEntry[] {
  const dir = join(ledgerPath, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  let gitCommit = 'unknown';
  try {
    const gitRes = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf-8' });
    if (gitRes.status === 0 && gitRes.stdout) gitCommit = gitRes.stdout.trim();
  } catch {}

  const timestamp = new Date().toISOString();
  const existingLedger = readLedger(ledgerPath);
  const ledgerMap = new Map<string, TokenLedgerEntry>();

  // 1. Populate map with existing Git records (monotonic survival across resets)
  for (const entry of existingLedger) {
    const key = getLedgerKey(entry.tool, entry.model);
    ledgerMap.set(key, entry);
  }

  // 2. Merge live detected entries monotonically (high-water-mark)
  for (const live of liveEntries) {
    const key = getLedgerKey(live.client, live.model);
    const prev = ledgerMap.get(key);

    if (!prev) {
      ledgerMap.set(key, {
        timestamp, sessionId: `tokscale-${live.client}-${live.model}`.replace(/[^a-zA-Z0-9-_]/g, '-'),
        tool: live.client || 'unknown', model: live.model || 'unknown',
        inputTokens: live.input, outputTokens: live.output, cachedTokens: live.cacheRead || 0,
        reasoningTokens: live.reasoning || 0, messages: live.messageCount || 0,
        costUsd: Number(live.cost.toFixed(4)), gitCommit,
        summary: `Tokscale verified: ${live.workspaceLabel || 'repo'} (${live.messageCount} msgs)`,
      });
    } else {
      const newInput = Math.max(prev.inputTokens, live.input);
      const newOutput = Math.max(prev.outputTokens, live.output);
      const newCache = Math.max(prev.cachedTokens, live.cacheRead || 0);
      const newReasoning = Math.max(prev.reasoningTokens || 0, live.reasoning || 0);
      const newMsgs = Math.max(prev.messages || 0, live.messageCount || 0);
      const newCost = Math.max(prev.costUsd, Number(live.cost.toFixed(4)));
      const hasInc = newInput > prev.inputTokens || newOutput > prev.outputTokens || newCache > prev.cachedTokens || newMsgs > (prev.messages || 0);
      ledgerMap.set(key, {
        timestamp: hasInc ? timestamp : prev.timestamp,
        sessionId: prev.sessionId, tool: prev.tool, model: prev.model,
        inputTokens: newInput, outputTokens: newOutput, cachedTokens: newCache,
        reasoningTokens: newReasoning, messages: newMsgs, costUsd: newCost,
        gitCommit: hasInc ? gitCommit : prev.gitCommit,
        summary: `Tokscale verified: ${live.workspaceLabel || 'repo'} (${newMsgs} msgs)`,
      });
    }
  }

  const merged = Array.from(ledgerMap.values());
  merged.sort((a, b) => b.costUsd - a.costUsd);

  writeFileSync(ledgerPath, merged.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf-8');
  return merged;
}

export function getAllRepoEntries(showAll = false): { entries: TokscaleEntry[]; hasUncommittedUpdates: boolean } {
  const rawReport = fetchRawTokscaleReport();
  const workspaces = getRepoWorkspaces();
  const cliEntries = rawReport?.entries
    ? showAll ? rawReport.entries : filterEntriesByWorkspace(rawReport.entries, workspaces)
    : [];

  const desktopEntries = loadAntigravityDesktopSessions(workspaces);
  const liveEntries = [...desktopEntries, ...cliEntries];

  // Load Git-committed ledger
  const gitEntries = readLedger(LEDGER_PATH);
  const entryMap = new Map<string, TokscaleEntry>();

  // 1. Seed with Git ledger entries (ensures historical survival across machine resets)
  for (const ge of gitEntries) {
    const key = getLedgerKey(ge.tool, ge.model);
    entryMap.set(key, {
      client: ge.tool, workspaceKey: process.cwd(), workspaceLabel: workspaces.labels[0] || 'org_website_clone',
      model: ge.model, provider: ge.model.includes('claude') ? 'anthropic' : ge.model.includes('gpt') ? 'openai' : 'google',
      input: ge.inputTokens, output: ge.outputTokens, cacheRead: ge.cachedTokens, cacheWrite: 0,
      reasoning: ge.reasoningTokens || 0, messageCount: ge.messages || 0, cost: ge.costUsd,
    });
  }

  let hasUncommittedUpdates = false;

  // 2. Reconcile with live entries
  for (const le of liveEntries) {
    const key = getLedgerKey(le.client, le.model);
    const existing = entryMap.get(key);
    if (!existing) {
      entryMap.set(key, { ...le });
      hasUncommittedUpdates = true;
    } else {
      if (le.input > existing.input || le.output > existing.output || le.cacheRead > existing.cacheRead || le.messageCount > existing.messageCount) {
        hasUncommittedUpdates = true;
      }
      existing.input = Math.max(existing.input, le.input);
      existing.output = Math.max(existing.output, le.output);
      existing.cacheRead = Math.max(existing.cacheRead, le.cacheRead);
      existing.reasoning = Math.max(existing.reasoning || 0, le.reasoning || 0);
      existing.messageCount = Math.max(existing.messageCount, le.messageCount);
      existing.cost = Math.max(existing.cost, le.cost);
    }
  }

  const entries = Array.from(entryMap.values());
  entries.sort((a, b) => b.cost - a.cost);
  return { entries, hasUncommittedUpdates };
}

export function renderReport(showAll = false): void {
  const workspaces = getRepoWorkspaces();
  const { entries, hasUncommittedUpdates } = getAllRepoEntries(showAll);

  if (entries.length === 0) {
    console.log(`\n\x1b[1;33mℹ️  No AI token usage detected yet specifically for workspace: ${workspaces.labels.join(', ')}\x1b[0m`);
    console.log(`\x1b[1;30mTip: Run \x1b[1;36mrtk ./run.sh tokens all\x1b[0m\x1b[1;30m to view machine-wide usage.\x1b[0m\n`);
    return;
  }

  let totalIn = 0;
  let totalOut = 0;
  let totalCache = 0;
  let totalReasoning = 0;
  let totalCost = 0;
  let totalMessages = 0;

  for (const e of entries) {
    totalIn += e.input;
    totalOut += e.output;
    totalCache += e.cacheRead;
    totalReasoning += e.reasoning || 0;
    totalCost += e.cost;
    totalMessages += e.messageCount;
  }

  const totalTokens = totalIn + totalOut;
  const cacheHitRatio = totalTokens + totalCache > 0 ? ((totalCache / (totalTokens + totalCache)) * 100).toFixed(1) : '0.0';

  console.log(`\n\x1b[1;36m========================================================================================\x1b[0m`);
  console.log(`\x1b[1;37m 🔥 SG FORGE REPOSITORY AI TOKEN & SPEND LEDGER (TOKSCALE ENGINE)\x1b[0m`);
  console.log(`\x1b[1;30m    Scoped strictly to repository: ${workspaces.labels.join(', ')} · Zero Foreign Bleed\x1b[0m`);
  console.log(`\x1b[1;36m========================================================================================\x1b[0m\n`);

  console.log(`\x1b[1;32m📊 REPOSITORY LIFETIME TOTALS:\x1b[0m`);
  console.log(`   ├─ Total AI Spend:     \x1b[1;33m$${totalCost.toFixed(2)} USD\x1b[0m`);
  console.log(`   ├─ Total Active Tokens: \x1b[1;37m${formatNumber(totalTokens)}\x1b[0m (In: ${formatNumber(totalIn)} / Out: ${formatNumber(totalOut)})`);
  console.log(`   ├─ Prompt Cache Reads: \x1b[1;32m${formatNumber(totalCache)} tokens\x1b[0m (${cacheHitRatio}% cache hit rate)`);
  if (totalReasoning > 0) {
    console.log(`   ├─ Reasoning Tokens:   \x1b[1;35m${formatNumber(totalReasoning)} tokens\x1b[0m`);
  }
  console.log(`   ├─ Total Messages:     \x1b[1;36m${formatNumber(totalMessages)}\x1b[0m`);
  console.log(`   └─ Scope Isolation:    ${showAll ? 'Global Machine' : 'Strict Repository Scoped (Git Reconciled)'}`);

  if (hasUncommittedUpdates) {
    console.log(`\n   \x1b[1;33m⚡ Uncommitted live token updates detected.\x1b[0m`);
    console.log(`   \x1b[1;30m   Run \x1b[1;36mrtk ./run.sh tokens sync\x1b[0m\x1b[1;30m or commit changes to persist to logs/token-ledger.jsonl\x1b[0m`);
  }

  console.log(`\n\x1b[1;34m🧠 USAGE BREAKDOWN BY MODEL & CLIENT:\x1b[0m`);
  console.log(`┌──────────────────┬─────────────────┬───────────┬───────────┬───────────┬───────────┐`);
  console.log(`│ Client IDE       │ Model           │ Active    │ Cache     │ Cost      │ Msgs      │`);
  console.log(`├──────────────────┼─────────────────┼───────────┼───────────┼───────────┼───────────┤`);

  for (const e of entries) {
    const padClient = (e.client || 'unknown').padEnd(16).slice(0, 16);
    const padModel = (e.model || 'unknown').padEnd(15).slice(0, 15);
    const padActive = formatNumber(e.input + e.output).padEnd(9);
    const padCache = formatNumber(e.cacheRead).padEnd(9);
    const padCost = `$${e.cost.toFixed(2)}`.padEnd(9);
    const padMsgs = String(e.messageCount).padEnd(9);
    console.log(`│ ${padClient} │ ${padModel} │ ${padActive} │ ${padCache} │ ${padCost} │ ${padMsgs} │`);
  }
  console.log(`└──────────────────┴─────────────────┴───────────┴───────────┴───────────┴───────────┘`);

  console.log(`\n\x1b[1;30mCommands:\x1b[0m`);
  console.log(`   \x1b[1;33mrtk ./run.sh tokens sync\x1b[0m     · Sync metrics to logs/token-ledger.jsonl`);
  console.log(`   \x1b[1;33mrtk ./run.sh tokens history\x1b[0m  · View Git-committed ledger records`);
  console.log(`   \x1b[1;33mrtk ./run.sh tokens tui\x1b[0m      · Open interactive Tokscale dashboard`);
  console.log(`   \x1b[1;33mrtk ./run.sh tokens clients\x1b[0m  · Inspect detected local IDE storage roots`);
  console.log(`   \x1b[1;33mrtk ./run.sh tokens all\x1b[0m      · View all workspaces on machine\n`);
}

export function renderHistory(): void {
  const ledger = readLedger(LEDGER_PATH);
  if (ledger.length === 0) {
    console.log(`\n\x1b[1;33mℹ️  No committed token history found in logs/token-ledger.jsonl\x1b[0m\n`);
    return;
  }

  console.log(`\n\x1b[1;36m========================================================================================\x1b[0m`);
  console.log(`\x1b[1;37m 📜 SG FORGE GIT TOKEN LEDGER HISTORY (GROUND TRUTH)\x1b[0m`);
  console.log(`\x1b[1;30m    File: logs/token-ledger.jsonl · Preserved across machines and local cache resets\x1b[0m`);
  console.log(`\x1b[1;36m========================================================================================\x1b[0m\n`);

  console.log(`┌─────────────────────┬──────────────────┬─────────────────┬───────────┬───────────┬─────────┐`);
  console.log(`│ Last Synced         │ Client IDE       │ Model           │ Active    │ Cache     │ Commit  │`);
  console.log(`├─────────────────────┼──────────────────┼─────────────────┼───────────┼───────────┼─────────┤`);

  for (const e of ledger) {
    const padTime = e.timestamp.slice(0, 19).replace('T', ' ').padEnd(19);
    const padClient = (e.tool || 'unknown').padEnd(16).slice(0, 16);
    const padModel = (e.model || 'unknown').padEnd(15).slice(0, 15);
    const padActive = formatNumber(e.inputTokens + e.outputTokens).padEnd(9);
    const padCache = formatNumber(e.cachedTokens).padEnd(9);
    const padCommit = (e.gitCommit || 'head').padEnd(7).slice(0, 7);
    console.log(`│ ${padTime} │ ${padClient} │ ${padModel} │ ${padActive} │ ${padCache} │ ${padCommit} │`);
  }
  console.log(`└─────────────────────┴──────────────────┴─────────────────┴───────────┴───────────┴─────────┘\n`);
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const cmd = args[0] || '';

  if (cmd === 'sync') {
    const { entries } = getAllRepoEntries(false);
    const synced = syncTokensToLedger(entries);
    console.log(`✅ [tokscale-runner] Synchronized ${synced.length} repository token records monotonically to logs/token-ledger.jsonl`);
  } else if (cmd === 'history') {
    renderHistory();
  } else if (cmd === 'json') {
    const { entries } = getAllRepoEntries(false);
    console.log(JSON.stringify(entries, null, 2));
  } else if (cmd === 'all') {
    renderReport(true);
  } else if (cmd === '--help' || cmd === '-h') {
    console.log(`Usage: rtk ./run.sh tokens [sync|history|tui|clients|json|all]`);
  } else {
    renderReport(false);
  }
}

