---
name: codeburn
description: "Use CodeBurn and the persistent submodule token ledger (logs/token-ledger.jsonl) to track lifetime AI coding token spend and model breakdown within this submodule."
---

# /codeburn

Local-first AI token & spend tracker integrated with this submodule's git-tracked lifetime token ledger.

## When to use
- Checking lifetime submodule AI coding token consumption and dollar spend (`rtk ./run.sh tokens`)
- Synchronizing current session tokens and transcripts into the persistent ledger (`rtk ./run.sh tokens sync`)
- Launching the interactive terminal TUI dashboard (`rtk ./run.sh tokens tui`)

## Usage

```bash
# View formatted submodule lifetime token summary table
rtk ./run.sh tokens

# Synchronize current session tokens to logs/token-ledger.jsonl
rtk ./run.sh tokens sync

# Launch interactive terminal TUI dashboard
rtk ./run.sh tokens tui
```
