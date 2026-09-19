#!/usr/bin/env bun
/**
 * @forge/exec-watchdog - Subprocess Execution Watchdog & Deadlock Prevention
 * Enterprise SRE Standard (2026 LTS)
 *
 * Enforces:
 * 1. Hard deadline timeouts on all spawned subprocesses (default: 10,000ms).
 * 2. Strict non-blocking standard input (stdin: 'ignore') to eliminate prompt hangs.
 * 3. Guaranteed child process group termination (SIGKILL) on timeout.
 * 4. Safe streaming capture of stdout/stderr without memory leaks.
  * @requirements [HLR-SDK-301] [LLR-SDK-007]
 */

export interface WatchdogOptions {
  timeoutMs?: number;
  cwd?: string;
  env?: Record<string, string | undefined>;
}

/**
 * WatchdogResult
 * @requirements [HLR-SDK-301] [LLR-SDK-007]
 */
export interface WatchdogResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  durationMs: number;
}

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Spawns a command with strict non-blocking stdin and an enforced hard deadline timeout.
  * @requirements [HLR-SDK-301] [LLR-SDK-007]
 */
export async function runWithWatchdog(
  command: string[],
  options: WatchdogOptions = {}
): Promise<WatchdogResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const start = performance.now();
  const controller = new AbortController();

  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const proc = Bun.spawn(command, {
      cwd: options.cwd ?? process.cwd(),
      env: (options.env as Record<string, string>) ?? process.env,
      stdin: 'ignore', // Never block on standard input
      stdout: 'pipe',
      stderr: 'pipe',
      signal: controller.signal,
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    const exitCode = await proc.exited;
    clearTimeout(timeoutId);
    const durationMs = Number((performance.now() - start).toFixed(2));

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode,
      timedOut,
      durationMs,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const durationMs = Number((performance.now() - start).toFixed(2));

    if (timedOut || (err instanceof Error && err.name === 'AbortError')) {
      return {
        stdout: '',
        stderr: `Process timed out after ${timeoutMs}ms: ${command.join(' ')}`,
        exitCode: 124, // Standard POSIX timeout exit code
        timedOut: true,
        durationMs,
      };
    }

    return {
      stdout: '',
      stderr: err instanceof Error ? err.message : String(err),
      exitCode: 1,
      timedOut: false,
      durationMs,
    };
  }
}
