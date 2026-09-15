/**
 * Submodule Lifetime Token & Spend Dashboard
 * Autonomous Micro-App Submodule - Enterprise Clean Architecture (2026 LTS)
 *
 * Renders persistent repository-wide AI token and cost metrics
 * across all tools and agent sessions within this submodule.
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { readLedger, syncCurrentSession, type TokenLedgerEntry } from './sync-tokens';

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return n.toLocaleString();
}

function renderDashboard() {
  const currentSessionId = process.env.CONVERSATION_ID || 'b5e26643-481f-4ff2-b0f3-f4adbd0380ef';
  syncCurrentSession(currentSessionId);

  const entries = readLedger();
  if (entries.length === 0) {
    console.log('⚠️ [tokens] No lifetime token records found in logs/token-ledger.jsonl');
    return;
  }

  let totalCost = 0;
  let totalIn = 0;
  let totalOut = 0;
  let totalCached = 0;

  const modelMap: Record<string, { cost: number; tokens: number; sessions: number }> = {};
  const toolMap: Record<string, { cost: number; tokens: number; sessions: number }> = {};

  for (const entry of entries) {
    totalCost += entry.costUsd || 0;
    totalIn += entry.inputTokens || 0;
    totalOut += entry.outputTokens || 0;
    totalCached += entry.cachedTokens || 0;

    const m = entry.model || 'unknown';
    if (!modelMap[m]) modelMap[m] = { cost: 0, tokens: 0, sessions: 0 };
    modelMap[m].cost += entry.costUsd || 0;
    modelMap[m].tokens += (entry.inputTokens || 0) + (entry.outputTokens || 0);
    modelMap[m].sessions += 1;

    const t = entry.tool || 'unknown';
    if (!toolMap[t]) toolMap[t] = { cost: 0, tokens: 0, sessions: 0 };
    toolMap[t].cost += entry.costUsd || 0;
    toolMap[t].tokens += (entry.inputTokens || 0) + (entry.outputTokens || 0);
    toolMap[t].sessions += 1;
  }

  const totalTokens = totalIn + totalOut;
  const cacheHitRatio = totalTokens > 0 ? ((totalCached / (totalTokens + totalCached)) * 100).toFixed(1) : '0.0';

  console.log(`\n\x1b[1;36m========================================================================================\x1b[0m`);
  console.log(`\x1b[1;37m 🔥 SUBMODULE LIFETIME TOKEN & SPEND LEDGER\x1b[0m`);
  console.log(`\x1b[1;30m    Tracked in Git (logs/token-ledger.jsonl) · Never resets across machines\x1b[0m`);
  console.log(`\x1b[1;36m========================================================================================\x1b[0m\n`);

  console.log(`\x1b[1;32m📊 SUBMODULE LIFETIME TOTALS:\x1b[0m`);
  console.log(`   ├─ Total AI Spend:     \x1b[1;33m$${totalCost.toFixed(2)} USD\x1b[0m`);
  console.log(`   ├─ Total Active Tokens: \x1b[1;37m${formatNumber(totalTokens)}\x1b[0m (In: ${formatNumber(totalIn)} / Out: ${formatNumber(totalOut)})`);
  console.log(`   ├─ Prompt Cache Reads: \x1b[1;32m${formatNumber(totalCached)} tokens\x1b[0m (${cacheHitRatio}% cache hit rate)`);
  console.log(`   ├─ Lifetime Sessions:  \x1b[1;35m${entries.length}\x1b[0m`);
  console.log(`   └─ Storage Invariant:  Git-committed (preserved across machine migration)`);

  console.log(`\n\x1b[1;34m🧠 USAGE BREAKDOWN BY MODEL:\x1b[0m`);
  console.log(`┌────────────────────────┬─────────────┬─────────────┬────────────┐`);
  console.log(`│ Model Name             │ Cost (USD)  │ Tokens      │ Sessions   │`);
  console.log(`├────────────────────────┼─────────────┼─────────────┼────────────┤`);
  for (const [model, stats] of Object.entries(modelMap)) {
    const padModel = model.padEnd(22).slice(0, 22);
    const padCost = `$${stats.cost.toFixed(2)}`.padEnd(11);
    const padTokens = formatNumber(stats.tokens).padEnd(11);
    const padSessions = String(stats.sessions).padEnd(10);
    console.log(`│ ${padModel} │ ${padCost} │ ${padTokens} │ ${padSessions} │`);
  }
  console.log(`└────────────────────────┴─────────────┴─────────────┴────────────┘`);

  console.log(`\n\x1b[1;35m🛠️  USAGE BREAKDOWN BY TOOL:\x1b[0m`);
  console.log(`┌────────────────────────┬─────────────┬─────────────┬────────────┐`);
  console.log(`│ Tool Platform          │ Cost (USD)  │ Tokens      │ Sessions   │`);
  console.log(`├────────────────────────┼─────────────┼─────────────┼────────────┤`);
  for (const [tool, stats] of Object.entries(toolMap)) {
    const padTool = tool.padEnd(22).slice(0, 22);
    const padCost = `$${stats.cost.toFixed(2)}`.padEnd(11);
    const padTokens = formatNumber(stats.tokens).padEnd(11);
    const padSessions = String(stats.sessions).padEnd(10);
    console.log(`│ ${padTool} │ ${padCost} │ ${padTokens} │ ${padSessions} │`);
  }
  console.log(`└────────────────────────┴─────────────┴─────────────┴────────────┘`);

  console.log(`\n\x1b[1;37m📜 RECENT SUBMODULE SESSIONS:\x1b[0m`);
  const recent = entries.slice(-5).reverse();
  for (const s of recent) {
    const date = s.timestamp ? s.timestamp.split('T')[0] : 'recent';
    console.log(`   • [${date}] \x1b[36m${s.sessionId.slice(0, 8)}\x1b[0m | ${s.model} | $${s.costUsd.toFixed(2)} | ${s.summary || 'Session'}`);
  }
  console.log(`\n\x1b[1;30mTip: Run \x1b[1;33m./run.sh tokens tui\x1b[0m\x1b[1;30m for interactive CodeBurn terminal dashboard\x1b[0m\n`);
}

renderDashboard();
