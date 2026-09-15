#!/usr/bin/env bun
/**
 * SG Forge Submodule - Autonomous Micro-App Database Backup Engine (2026 LTS)
 * Enterprise Production Integrity Standard
 *
 * 1. Atomic Live Snapshot via SQLite VACUUM INTO (zero locks, zero corrupted WAL frames)
 * 2. Post-Backup Verification: PRAGMA integrity_check & PRAGMA foreign_key_check
 * 3. Rolling Retention Pruning: Automatically prunes backups older than 7 days
 * 4. Structured JSON Manifest: Records SHA-256 hashes, byte sizes, and timestamps
 */

import { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const SUBMODULE_ROOT = process.cwd();
const DATA_DIR = join(SUBMODULE_ROOT, 'data');
const BACKUP_DIR = join(SUBMODULE_ROOT, 'backups', 'db');
const RETENTION_HOURS = Math.max(1, Number(process.env.DB_BACKUP_RETENTION_HOURS) || 168);

/**
 * MicroAppBackupResult
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export interface MicroAppBackupResult {
  success: boolean;
  dbName: string;
  sourcePath: string;
  snapshotPath: string;
  sizeBytes: number;
  sha256: string;
  integrityOk: boolean;
  foreignKeyOk: boolean;
  error?: string;
}

/**
 * executeMicroAppBackup
 * @requirements [HLR-SDK-301] [LLR-SUB-001]
 */
export function executeMicroAppBackup(): {
  manifestPath: string;
  results: MicroAppBackupResult[];
} {
  console.log('📦 [Forge App Backup] Starting isolated database backup...\n');

  if (!existsSync(DATA_DIR)) {
    console.error(`❌ Data directory not found: ${DATA_DIR}`);
    process.exit(1);
  }

  // 1. Discover active SQLite databases in local data/ folder
  const dbFiles = readdirSync(DATA_DIR).filter(
    (f) => f.endsWith('.db') && !f.startsWith('test_') && !f.includes('-wal') && !f.includes('-shm')
  );

  if (dbFiles.length === 0) {
    console.log(`ℹ️ No database files found in ${DATA_DIR}. Nothing to back up.`);
    return { manifestPath: '', results: [] };
  }

  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-');
  const targetFolder = join(BACKUP_DIR, `snapshot_${dateStr}`);
  mkdirSync(targetFolder, { recursive: true });

  const results: MicroAppBackupResult[] = [];

  for (const dbFile of dbFiles) {
    const srcPath = join(DATA_DIR, dbFile);
    const destPath = join(targetFolder, dbFile);

    console.log(`  🔄 Performing atomic VACUUM INTO for ${dbFile}...`);

    try {
      const srcDb = new Database(srcPath, { readonly: true });
      const escapedDest = destPath.replace(/'/g, "''");
      srcDb.run(`VACUUM INTO '${escapedDest}';`);
      srcDb.close();

      // Integrity verification
      const verifyDb = new Database(destPath, { readonly: true });
      const integrityCheck = (verifyDb.query('PRAGMA integrity_check;').get() as any)?.integrity_check === 'ok';
      const foreignKeys = verifyDb.query('PRAGMA foreign_key_check;').all();
      const foreignKeyOk = foreignKeys.length === 0;
      verifyDb.close();

      const sizeBytes = statSync(destPath).size;
      const sha256 = createHash('sha256').update(readFileSync(destPath)).digest('hex');

      const isSuccess = integrityCheck && foreignKeyOk;

      results.push({
        success: isSuccess,
        dbName: dbFile,
        sourcePath: srcPath,
        snapshotPath: destPath,
        sizeBytes,
        sha256,
        integrityOk: integrityCheck,
        foreignKeyOk,
      });

      if (isSuccess) {
        console.log(`  ✅ [${dbFile}] Backup verified OK (${(sizeBytes / 1024).toFixed(1)} KB | SHA-256: ${sha256.slice(0, 12)}...)`);
      } else {
        console.error(`  ❌ [${dbFile}] Integrity check FAILED! (integrity: ${integrityCheck}, fk: ${foreignKeyOk})`);
      }
    } catch (err: any) {
      console.error(`  ❌ [${dbFile}] Backup failed: ${err.message}`);
      results.push({
        success: false,
        dbName: dbFile,
        sourcePath: srcPath,
        snapshotPath: destPath,
        sizeBytes: 0,
        sha256: '',
        integrityOk: false,
        foreignKeyOk: false,
        error: err.message,
      });
    }
  }

  // 2. Write Snapshot Manifest
  const manifest = {
    timestamp,
    dateIso: new Date(timestamp).toISOString(),
    retentionHours: RETENTION_HOURS,
    targetFolder,
    results,
  };
  const manifestPath = join(targetFolder, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  // 3. Prune Expired Snapshots (Rolling retention window)
  try {
    const now = Date.now();
    const maxAgeMs = RETENTION_HOURS * 60 * 60 * 1000;
    for (const entry of readdirSync(BACKUP_DIR)) {
      if (entry.startsWith('snapshot_')) {
        const fullDir = join(BACKUP_DIR, entry);
        try {
          const stats = statSync(fullDir);
          if (now - stats.mtimeMs > maxAgeMs) {
            console.log(`  🧹 Pruning expired snapshot: ${entry}`);
            rmSync(fullDir, { recursive: true, force: true });
          }
        } catch {}
      }
    }
  } catch {}

  console.log(`\n🎉 [Forge App Backup] Complete! Manifest: ${manifestPath}\n`);
  return { manifestPath, results };
}

if (import.meta.main) {
  const { results } = executeMicroAppBackup();
  const anyFailed = results.some((r) => !r.success);
  if (anyFailed) {
    process.exit(1);
  }
}
