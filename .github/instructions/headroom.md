## headroom

This project integrates Headroom (`headroomlabs-ai/headroom`) as a local context compression layer for AI coding agents.

### Rules & Workflow:
1. **Context & Payload Compression**:
   - For large JSON payloads, test outputs, or extensive log dumps, run `rtk ./run.sh headroom compress <file>` to inspect token reduction before incorporating large raw blobs into prompts.
   - Headroom achieves 21%–57% token reduction without losing critical error lines, stack traces, or symbol declarations.
2. **Local Compression Proxy**:
   - When running multi-agent workflows or streaming tool calls, Headroom routes traffic through `http://127.0.0.1:8787` (`./run.sh headroom proxy`) to compress prompts and enforce verbosity steering locally.
3. **Reversible CCR (Context Cache Recovery)**:
   - Headroom keeps full-text originals cached locally so agents can retrieve verbatim text when fine-grained details are needed.
4. **Zero Host Alterations**:
   - The CLI executes via `portables/bin/headroom` and the portable Bun runner `scripts/headroom-runner.ts` with zero host GPU/PyTorch package bloat.
