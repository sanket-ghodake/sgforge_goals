#!/usr/bin/env bun
/**
 * Standalone Portable Visual Tree Tool
 * Project Visual Hierarchy Analyzer
 */
import { readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const ARGS = process.argv.slice(2);
let maxDepth = 4;
let targetDir = process.cwd();

// Parse arguments
for (let i = 0; i < ARGS.length; i++) {
  if (ARGS[i] === "-L" && ARGS[i + 1]) {
    maxDepth = parseInt(ARGS[i + 1], 10) || 4;
    i++;
  } else if (!ARGS[i].startsWith("-")) {
    targetDir = ARGS[i];
  }
}

const IGNORE = new Set([
  "node_modules",
  ".git",
  ".venv",
  ".ruff_cache",
  ".tsbuildinfo",
  "graphify-out",
  "dist",
  "build",
]);

let totalDirs = 0;
let totalFiles = 0;

function printTree(dir: string, prefix = "", depth = 1) {
  if (depth > maxDepth) return;
  let entries: string[] = [];
  try {
    entries = readdirSync(dir).filter((e) => !IGNORE.has(e));
  } catch {
    return;
  }

  entries.sort((a, b) => {
    const aIsDir = statSync(join(dir, a)).isDirectory();
    const bIsDir = statSync(join(dir, b)).isDirectory();
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const fullPath = join(dir, entry);
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";

    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        totalDirs++;
        console.log(`${prefix}${connector}\x1b[34m\x1b[1m${entry}/\x1b[0m`);
        printTree(fullPath, prefix + childPrefix, depth + 1);
      } else {
        totalFiles++;
        console.log(`${prefix}${connector}${entry}`);
      }
    } catch {}
  });
}

console.log(`\x1b[36m\x1b[1m${basename(targetDir) || targetDir}\x1b[0m`);
printTree(targetDir);
console.log(`\n${totalDirs} directories, ${totalFiles} files`);
