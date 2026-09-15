# Portable Binaries & Tool Wrappers (Submodule Toolchain)

This directory contains standalone, self-resolving POSIX executable wrappers for development, code intelligence, AI token tracking, security, and quality gates.

## Included Tools

| Tool | Purpose | Upstream |
| :--- | :--- | :--- |
| `bun` / `bun.cmd` | Portable Bun runtime runner | [Oven Bun](https://bun.sh) |
| `bunx` / `bunx.cmd` | Portable Bunx package runner | [Oven Bun](https://bun.sh) |
| `rtk` / `rtk.cmd` | Terminal token compression and command optimization | Local / Monorepo Portable |
| `biome` | Fast AST code style and syntax validator | [@biomejs/biome](https://biomejs.dev) |
| `knip` | Dead code and unused export scanner | [knip](https://knip.dev) |
| `gitleaks` | Secret and private key leak scanner | [gitleaks](https://github.com/gitleaks/gitleaks) |
| `semgrep` | Static application security testing (SAST) | [semgrep](https://semgrep.dev) |
| `shellcheck` | Shell script syntax and safety linter | [shellcheck](https://www.shellcheck.net) |
| `spectral` | OpenAPI 3.1 contract and schema validator | [@stoplight/spectral-cli](https://stoplight.io) |
| `lizard` | Cyclomatic code complexity scanner | [lizard](https://github.com/terryyin/lizard) |
| `scc` | Source code lines and metrics counter | [scc](https://github.com/boyter/scc) |
| `graft` | Code context and symbol dependency graph engine | [@nanonets/graft](https://github.com/trailhq/Graft) |
| `codeburn` | AI token and lifetime spend tracker | [getagentseal/codeburn](https://github.com/getagentseal/codeburn) |
| `headroom` | Context and prompt compression engine | [headroomlabs-ai/headroom](https://github.com/headroomlabs-ai/headroom) |
| `council` | Council of AI multi-agent decision framework | [Silotech](https://github.com/Silotech) |

## Self-Resolving Execution Strategy

Every wrapper operates autonomously following this resolution hierarchy:
1. **Local Submodule**: Checks `portables/` or `node_modules/.bin/<tool>`.
2. **Monorepo Parent**: If running within the SG Forge monorepo, resolves `../../portables/bin/<tool>`.
3. **Host System**: Uses system installation if present.
4. **Fallback Runtime**: Executes non-destructive portable fallback via Bun or npx without global host modifications.
