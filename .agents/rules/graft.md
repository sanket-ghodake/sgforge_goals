## graft

This project integrates Graft (`@nanonets/graft`) as the microscopic code context and symbol dependency graph layer.

### Rules & Workflow:
1. **API Surface & Type Inspection**:
   - Before reading or editing a large source file, run `rtk graft skeleton <path/to/file.ts>` (or `rtk ./run.sh graft skeleton <file>`) to inspect type interfaces, exported functions, and signatures without pulling complete function bodies into context.
2. **Refactoring & Blast Radius Analysis**:
   - Before modifying, renaming, or refactoring an exported function, type, or class, run `rtk graft callers <symbol>` (or with `--direction out` or `--depth <N>`) to trace callers and callees across this submodule.
   - For staged or working-tree diffs, run `rtk graft blast` to verify impacted code.
3. **Task & Code Navigation**:
   - For targeted task questions, run `rtk graft ask "<query>"` to retrieve ranked nodes and exact `file:line` locations without blind grepping.
   - Run `rtk graft map` for a token-budgeted overview of directory clusters and central hubs.
4. **Freshness & Autonomy**:
   - Graft operates standalone within this submodule with zero telemetry (`GRAFT_TELEMETRY=0`, `DO_NOT_TRACK=1`).
