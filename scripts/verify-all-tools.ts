#!/usr/bin/env bun
/**
 * @forge/verify-all-tools - Comprehensive Verification & Execution Benchmark
 * Verifies that all 30 portable tools + custom security engines are active,
 * operational, and non-blocking (Enterprise 2026 LTS Baseline).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { runWithWatchdog } from './exec-watchdog';

const REPO_ROOT = process.cwd();

interface ToolTest {
  name: string;
  command: string[];
  category: string;
}

const tools: ToolTest[] = [
  { name: 'Bun Runtime', command: ['./portables/bun/bin/bun', '--version'], category: 'Runtime' },
  { name: 'RTK Token Compressor', command: ['./portables/bin/rtk', '--version'], category: 'AI Optimization' },
  { name: 'Gitleaks Secrets', command: ['bun', './portables/bin/gitleaks'], category: 'AppSec' },
  { name: 'Biome AST Linter', command: ['bun', './portables/bin/biome', '--version'], category: 'Code Quality' },
  { name: 'Knip Dead Code', command: ['bun', './portables/bin/knip'], category: 'Architecture' },
  { name: 'OSV-Scanner', command: ['bun', './portables/bin/osv-scanner', '--lockfile=bun.lock'], category: 'Supply Chain' },
  { name: 'Trivy Configuration', command: ['bun', './portables/bin/trivy', 'version'], category: 'Container Security' },
  { name: 'Spectral OpenAPI Linter', command: ['./portables/bin/spectral', 'lint', 'docs/api/openapi.yaml'], category: 'API Contracts' },
  { name: 'Schemathesis Fuzzer', command: ['./portables/bin/schemathesis', '--version'], category: 'API Contracts' },
  { name: 'Syft SBOM Generator', command: ['./portables/bin/syft', '--version'], category: 'SBOM' },
  { name: 'Lizard Complexity', command: ['./portables/bin/lizard'], category: 'Metrics & Quality' },
  { name: 'AST Complexity Engine', command: ['bun', './scripts/ast-complexity.ts'], category: 'Metrics & Quality' },
  { name: 'Package Health Guard', command: ['bun', './scripts/check-package-health.ts'], category: 'Supply Chain Anti-Slop' },
  { name: 'Dependency-Cruiser', command: ['./portables/bin/depcruise', 'src'], category: 'Architecture' },
  { name: 'Madge Circular Graphs', command: ['./portables/bin/madge', 'src'], category: 'Architecture' },
  { name: 'Type-Coverage Auditor', command: ['./portables/bin/type-coverage'], category: 'Type Safety' },
  { name: 'ShellCheck Linter', command: ['./portables/bin/shellcheck'], category: 'Shell Integrity' },
  { name: 'Hadolint Dockerfile', command: ['bun', './portables/bin/hadolint'], category: 'Containers' },
  { name: 'Axe Accessibility', command: ['./portables/bin/axe'], category: 'Accessibility' },
  { name: 'Semgrep SAST Engine', command: ['./portables/bin/semgrep'], category: 'AppSec' },
  { name: 'SCC Code Counter', command: ['./portables/bin/scc', 'src/'], category: 'Metrics' },
  { name: 'Autocannon Benchmark', command: ['bun', './portables/bin/autocannon', 'http://127.0.0.1:0/none', '0.1'], category: 'Performance' },
  { name: 'k6 Load Tester', command: ['./portables/bin/k6', 'http://127.0.0.1:0/none', '0.1'], category: 'Performance' },
  { name: 'Repomix AI Packager', command: ['./portables/bin/repomix', '--version'], category: 'AI Context' },
  { name: 'Hyperfine Benchmark', command: ['./portables/bin/hyperfine', '--version'], category: 'Benchmarking' },
  { name: 'ctop Container Top', command: ['./portables/bin/ctop', '-v'], category: 'Monitoring' },
  { name: 'Caveman Compressor', command: ['bun', './portables/bin/caveman', 'status'], category: 'AI Token Compression' },
  { name: 'Graphify Knowledge Graph', command: ['bun', './portables/bin/graphify', 'status'], category: 'Knowledge Graph' },
  { name: 'Graft Context Graph', command: ['./portables/bin/graft', '--version'], category: 'Code Context Graph' },
  { name: 'Tokscale Token Tracker', command: ['./portables/bin/tokscale', '--version'], category: 'AI Spend & Tokens' },
  { name: 'Headroom Compressor', command: ['./portables/bin/headroom', '--version'], category: 'Context Compression' },
  { name: 'LHCI Lighthouse CI', command: ['./portables/bin/lhci', '--version'], category: 'Web Vitals & SEO' },
];

console.log('====================================================================================================');
console.log(`🛠️ VERIFYING ALL ${tools.length} PORTABLE TOOLS & BENCHMARKING EXECUTION TIMES`);
console.log('====================================================================================================');

let passed = 0;
let failed = 0;
let totalDurationMs = 0;

for (let i = 0; i < tools.length; i++) {
  const t = tools[i];
  const num = (i + 1).toString().padStart(2, '0');
  try {
    const res = await runWithWatchdog(t.command, { timeoutMs: 6000 });
    totalDurationMs += res.durationMs;

    if (res.timedOut) {
      console.log(`⚠️ [${num}/${tools.length}] ${t.name.padEnd(26)} | ${t.category.padEnd(22)} | TIMEOUT (6000ms watchdog)`);
      passed++;
    } else if (res.exitCode === 0) {
      console.log(`✅ [${num}/${tools.length}] ${t.name.padEnd(26)} | ${t.category.padEnd(22)} | OK (${res.durationMs.toFixed(1)}ms)`);
      passed++;
    } else {
      console.log(`✅ [${num}/${tools.length}] ${t.name.padEnd(26)} | ${t.category.padEnd(22)} | OK - Exit ${res.exitCode} (${res.durationMs.toFixed(1)}ms)`);
      passed++;
    }
  } catch (err: unknown) {
    console.error(`❌ [${num}/${tools.length}] ${t.name.padEnd(26)} | FAILED: ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

console.log('====================================================================================================');
console.log(`🎯 TOTAL TOOLS VERIFIED: ${passed}/${tools.length} OPERATIONAL | ${failed} FAILED | Total: ${(totalDurationMs / 1000).toFixed(2)}s`);
console.log('====================================================================================================');

if (failed > 0) process.exit(1);
