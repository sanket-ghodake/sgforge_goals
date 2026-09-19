/**
 * @file council-runner.ts
 * @description Standalone CLI Runner for The Council of AI Multi-Agent Decision Framework
 * @attribution Based on "The Council of AI: A Multi-Agent Prompting Framework for Better Decision-Making"
 *              by Marius Silo (Silotech.xyz) - https://medium.com/@Silotech.xyz/the-council-of-ai-a-multi-agent-prompting-framework-for-better-decision-making-8e7569c10584
 * @standards Enterprise Clean Architecture, Autonomous Submodule Isolation (2026 LTS)
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const VERSION = '1.0.0';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[38;2;248;113;113m',
  green: '\x1b[38;2;74;222;128m',
  amber: '\x1b[38;2;251;191;36m',
  cyan: '\x1b[38;2;56;189;248m',
  purple: '\x1b[38;2;192;132;252m',
  border: '\x1b[38;2;71;85;105m',
};

interface SubmoduleAssessment {
  topic: string;
  timestamp: string;
  skeptic: {
    title: string;
    vibe: string;
    points: string[];
    risk: string;
  };
  visionary: {
    title: string;
    vibe: string;
    points: string[];
    upside: string;
  };
  pragmatist: {
    title: string;
    vibe: string;
    points: string[];
    slice: string;
  };
  synthesis: {
    verdict: 'GO' | 'PIVOT' | 'REJECT';
    justification: string;
    mitigations: string[];
    immediateAction: string;
  };
}

function evaluate(topic: string): SubmoduleAssessment {
  const ts = new Date().toISOString();
  const lower = topic.toLowerCase();

  const touchesParent = lower.includes('parent') || lower.includes('monorepo') || lower.includes('apps/src');
  const touchesDb = lower.includes('db') || lower.includes('database') || lower.includes('turso') || lower.includes('schema');
  const touchesNetwork = lower.includes('api') || lower.includes('network') || lower.includes('egress') || lower.includes('external');

  return {
    topic,
    timestamp: ts,
    skeptic: {
      title: 'The Skeptic (Submodule Boundary & Security Auditor)',
      vibe: 'Strict isolation guardian, anti-coupling advocate.',
      points: [
        touchesParent
          ? 'VIOLATION OF INVARIANT 6: Submodules MUST NEVER import central platform code (apps/src/*). Keep dependencies completely autonomous.'
          : 'Encapsulation check: Ensure this feature does not leak submodule internals to outside consumers.',
        touchesDb
          ? 'INVARIANT 5 CHECK: Dedicated Turso DB only. Never share credentials or query another microservice database.'
          : 'Maintenance footprint: Will this require new npm packages? Verify provenance and age (>= 14 days).',
        touchesNetwork
          ? 'Network boundary: Submodule operates on forge-apps-net. Outbound traffic must define explicit timeouts and error boundaries.'
          : 'Complexity check: Keep file size <= 300 lines and cyclomatic complexity CCN <= 10.',
      ],
      risk: 'Architectural coupling or submodule leakage if boundaries are breached.',
    },
    visionary: {
      title: 'The Visionary (Autonomous Product Lead)',
      vibe: 'Feature innovator, micro-app capability expander.',
      points: [
        'Drives high user utility within this specific domain microservice.',
        'Preserves clean Git submodule autonomy: can be embedded into Forge or deployed standalone.',
        'Advances modern 2026 LTS micro-frontend patterns.',
      ],
      upside: 'Enhanced standalone microservice capability without compromising core platform air-gap.',
    },
    pragmatist: {
      title: 'The Pragmatist (Submodule Staff Builder)',
      vibe: 'Fast execution, test-driven implementer.',
      points: [
        'Scope to the minimal functional slice: zero gold-plating.',
        'Write Arrange-Act-Assert tests in test/ (Tier 1 unit, Tier 2 integration).',
        'Verify zero host changes: use local portables/bin or Bun portable.',
      ],
      slice: 'Implement the isolated route/component with colocated tests in under 100 lines.',
    },
    synthesis: {
      verdict: touchesParent ? 'REJECT' : touchesDb ? 'PIVOT' : 'GO',
      justification: touchesParent
        ? 'Cross-importing central platform code is strictly forbidden by Invariant 6.'
        : touchesDb
        ? 'Proceed only with dedicated Turso schema migrations and strict org_id scoping.'
        : 'Approved: aligns with autonomous submodule standard and clean architecture.',
      mitigations: [
        '1. Zero central platform imports (pure autonomous submodule).',
        '2. Complete 5-tier test coverage in test/ before staging.',
        '3. Structured RFC 7807 problem responses on errors.',
      ],
      immediateAction: 'Implement minimal route with unit/integration test in test/.',
    },
  };
}

function render(assessment: SubmoduleAssessment): void {
  const line = `${c.border}${'─'.repeat(72)}${c.reset}`;
  console.log(`\n${line}`);
  console.log(`${c.bold}${c.purple}🏛️  SUBMODULE COUNCIL OF AI${c.reset} ${c.dim}(v${VERSION})${c.reset}`);
  console.log(`${c.dim}Attribution: Marius Silo (Silotech.xyz) | Autonomous Submodule Toolchain${c.reset}`);
  console.log(`${line}`);
  console.log(`${c.bold}Topic:${c.reset} ${c.cyan}${assessment.topic}${c.reset}`);
  console.log(`${c.dim}Timestamp: ${assessment.timestamp}${c.reset}\n`);

  console.log(`${c.bold}${c.red}🔴 [ROUND 1] ${assessment.skeptic.title}${c.reset}`);
  for (const p of assessment.skeptic.points) console.log(`   ${c.red}•${c.reset} ${p}`);
  console.log(`   ${c.bold}Warning:${c.reset} ${c.dim}${assessment.skeptic.risk}${c.reset}\n`);

  console.log(`${c.bold}${c.green}🟢 [ROUND 2] ${assessment.visionary.title}${c.reset}`);
  for (const p of assessment.visionary.points) console.log(`   ${c.green}•${c.reset} ${p}`);
  console.log(`   ${c.bold}Upside:${c.reset} ${c.dim}${assessment.visionary.upside}${c.reset}\n`);

  console.log(`${c.bold}${c.amber}🟡 [ROUND 3] ${assessment.pragmatist.title}${c.reset}`);
  for (const p of assessment.pragmatist.points) console.log(`   ${c.amber}•${c.reset} ${p}`);
  console.log(`   ${c.bold}Day-1 Slice:${c.reset} ${c.cyan}${assessment.pragmatist.slice}${c.reset}\n`);

  const vColor = assessment.synthesis.verdict === 'GO' ? c.green : assessment.synthesis.verdict === 'PIVOT' ? c.amber : c.red;
  console.log(`${line}`);
  console.log(`${c.bold}⚖️  [ROUND 4] COUNCIL VERDICT: ${vColor}${c.bold}${assessment.synthesis.verdict}${c.reset}`);
  console.log(`${line}`);
  console.log(`${c.bold}Justification:${c.reset} ${assessment.synthesis.justification}`);
  console.log(`\n${c.bold}Mitigations:${c.reset}`);
  for (const m of assessment.synthesis.mitigations) console.log(`   ${m}`);
  console.log(`\n${c.bold}Immediate Action:${c.reset} ${c.cyan}${assessment.synthesis.immediateAction}${c.reset}\n`);
}

const args = process.argv.slice(2);
const topic = args.filter((a) => !a.startsWith('-')).join(' ').trim();

if (!topic || args.includes('--help') || args.includes('-h')) {
  console.log(`\nUsage: ./run.sh council "<topic or idea>" [--save]\n`);
  process.exit(0);
}

const assessment = evaluate(topic);
render(assessment);

if (args.includes('--save') || args.includes('-s')) {
  const councilDir = resolve(process.cwd(), 'logs', 'council');
  if (!existsSync(councilDir)) mkdirSync(councilDir, { recursive: true });
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const target = resolve(councilDir, `${new Date().toISOString().slice(0, 10)}-${slug}.md`);
  writeFileSync(target, `# Council Record: ${assessment.topic}\n\nVerdict: **${assessment.synthesis.verdict}**\n`, 'utf-8');
  console.log(`📝 Saved to: ${target}\n`);
}
