---
name: headroom
description: "Use Headroom for sub-millisecond context and prompt compression within this autonomous submodule."
---

# /headroom

Local-first context and prompt compression engine for autonomous submodules.

## When to use
- Measuring token compression savings on test logs or payloads (`rtk ./run.sh headroom compress <file>`)
- Verifying the status and health of the compression engine (`rtk ./run.sh headroom status`)
- Checking compression statistics (`rtk ./run.sh headroom stats`)

## Usage

```bash
# Check Headroom health
rtk ./run.sh headroom status

# Test compression on a file or payload
rtk ./run.sh headroom compress <path/to/file>

# View compression statistics
rtk ./run.sh headroom stats
```
