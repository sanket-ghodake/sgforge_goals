# Portable ctop (Container Top Terminal Metrics Dashboard)

Standalone portable binary for `ctop` (v0.7.7 linux-amd64) providing real-time top-like telemetry and resource monitoring for Docker containers.

---

## 🎯 Features
* **Live Container Metrics**: Real-time monitoring of CPU%, memory usage & limits, network I/O, and disk block I/O.
* **Zero Host Modifications**: Standalone portable binary located at `portables/ctop/ctop` requiring zero OS-level installs (`apt`, `brew`, `npm`).
* **Headless & CI-Safe TTY Detection**: Wrapped by [`portables/bin/ctop`](portables/bin/ctop) with automatic TTY detection. In non-interactive or piping contexts (`[ ! -t 0 ]`), automatically falls back to clean, single-frame `docker stats --no-stream` without crashing or throwing `termbox: EOF` panics.

---

## 🚀 Usage

### Interactive Terminal TUI
```bash
./run.sh top
# or
./portables/bin/ctop
```

### Headless / Pipe Usage
```bash
./portables/bin/ctop | cat
```

---

## 🔒 Architectural Invariants
* **Binary Location**: `portables/ctop/ctop` (executable binary).
* **Wrapper Script**: `portables/bin/ctop` (self-resolving POSIX wrapper, zero OS symlinks).
* **Cross-Platform Git Attributes**: Registered as binary (`-text -diff`) in `.gitattributes`.

