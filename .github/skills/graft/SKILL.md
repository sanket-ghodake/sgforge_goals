---
name: graft
description: "Use Graft for fine-grained symbol call graphs, API skeletons, blast radius impact, and codebase navigation within this autonomous submodule."
---

# /graft

Fine-grained code context layer for this submodule: symbol-level dependency graphs, type/API skeletons, and blast radius auditing.

## When to use
- Inspecting API skeleton of a source file (`rtk ./run.sh graft skeleton <path>`)
- Tracing callers and callees of a function or class (`rtk ./run.sh graft callers <symbol>`)
- Auditing the blast radius of working tree edits (`rtk ./run.sh graft blast`)
- Querying exact symbol locations without blind grepping (`rtk ./run.sh graft ask "<query>"`)

## Usage

```bash
# Skeletons of a single file
rtk ./run.sh graft skeleton src/server.ts

# Call hierarchy
rtk ./run.sh graft callers handleRequest

# Check blast radius of active changes
rtk ./run.sh graft blast
```
