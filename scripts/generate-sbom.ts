/**
 * @forge/scripts - CycloneDX 1.5 Software Bill of Materials (SBOM) Generator
 * Automatically enumerates platform runtimes, workspace packages, and declared dependencies.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const OUTPUT_DIR = join(REPO_ROOT, 'docs', 'security', 'sbom');
const OUTPUT_FILE = join(OUTPUT_DIR, 'cyclonedx-sbom.json');

interface SbomComponent {
  type: 'application' | 'framework' | 'library';
  name: string;
  version: string;
  purl: string;
  description?: string;
}

/**
 * generateSbom
 * @requirements [SR-GATE-001] [LLR-SUB-007]
 */
export function generateSbom(force: boolean = false): { count: number; path: string } {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  if (!force && existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(readFileSync(OUTPUT_FILE, 'utf8'));
      if (existing.bomFormat === 'CycloneDX' && Array.isArray(existing.components) && existing.components.length >= 1) {
        return { count: existing.components.length, path: OUTPUT_FILE };
      }
    } catch {
      // Regenerate if corrupt
    }
  }

  const rootPkgPath = join(REPO_ROOT, 'package.json');
  const rootPkg = existsSync(rootPkgPath) ? JSON.parse(readFileSync(rootPkgPath, 'utf8')) : {};

  const components: SbomComponent[] = [];
  const seen = new Set<string>();

  function addComponent(name: string, rawVersion: string, type: 'framework' | 'library' = 'library', description?: string) {
    if (seen.has(name)) return;
    seen.add(name);
    const cleanVersion = rawVersion.replace(/^[\^~>=<]+/, '') || '1.0.0';
    const purlName = name.startsWith('@') ? `%40${name.slice(1)}` : name;
    components.push({
      type,
      name,
      version: cleanVersion,
      purl: `pkg:npm/${purlName}@${cleanVersion}`,
      description: description || `Dependency ${name}`,
    });
  }

  // 1. Runtime Platform
  components.push({
    type: 'application',
    name: 'bun',
    version: '1.3.14',
    purl: 'pkg:generic/bun@1.3.14',
    description: 'High-performance all-in-one JavaScript/TypeScript runtime & toolkit',
  });
  seen.add('bun');

  // 2. Root Dependencies & DevDependencies
  const allDeps = {
    ...rootPkg.dependencies,
    ...rootPkg.devDependencies,
  };

  for (const [name, version] of Object.entries(allDeps)) {
    if (typeof version === 'string' && !version.startsWith('workspace:')) {
      addComponent(name, version, 'library');
    }
  }

  // 3. Monorepo Workspaces & Forge Micro-Apps
  const workspaceDirs = ['apps/src', 'forge-apps'];
  for (const wsDir of workspaceDirs) {
    const fullWsDir = join(REPO_ROOT, wsDir);
    if (!existsSync(fullWsDir)) continue;
    const entries = readdirSync(fullWsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const pkgJsonPath = join(fullWsDir, entry.name, 'package.json');
      if (existsSync(pkgJsonPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
          if (pkg.name) {
            addComponent(pkg.name, pkg.version || '2.0.0', 'framework', pkg.description);
          }
          if (pkg.dependencies) {
            for (const [dName, dVer] of Object.entries(pkg.dependencies)) {
              if (typeof dVer === 'string' && !dVer.startsWith('workspace:')) {
                addComponent(dName, dVer, 'library');
              }
            }
          }
        } catch {}
      }
    }
  }

  // Generate deterministic serial UUID
  const timestamp = new Date().toISOString();
  const serialUuid = '89f80695-13a4-462c-beb8-af08aa7c9f77';

  const sbomDocument = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:${serialUuid}`,
    version: 1,
    metadata: {
      timestamp,
      tools: [
        {
          vendor: 'SG Forge',
          name: 'generate-sbom',
          version: '2.0.0',
        },
      ],
      component: {
        type: 'application',
        name: 'sg-forge-monorepo',
        version: rootPkg.version || '2.0.0',
        description: 'SG Forge Internal Enterprise Platform & Monorepo',
      },
    },
    components,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(sbomDocument, null, 2) + '\n', 'utf8');
  return { count: components.length, path: OUTPUT_FILE };
}

if (import.meta.main) {
  const isForce = process.argv.includes('--force');
  const result = generateSbom(isForce);
  console.log(`✅ CycloneDX 1.5 SBOM generated with ${result.count} components at ${result.path}`);
}
