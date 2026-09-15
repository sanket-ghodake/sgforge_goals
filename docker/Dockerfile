# ==============================================================================
# SG Forge Submodule - Standalone Micro-App Container (2026 LTS)
# Multi-Stage Alpine-Based Image with AOT Minification & Obfuscation
# ==============================================================================

FROM oven/bun:1.3-alpine AS builder

WORKDIR /build

COPY package.json bun.lock* tsconfig.json ./
RUN if [ -f bun.lock ] || [ -f bun.lockb ] || grep -q '"dependencies": {' package.json; then bun install --production 2>/dev/null || true; fi

COPY src/ ./src/

# AOT bundle & minify into /build/dist
RUN bun build src/server.ts --target=bun --minify --sourcemap=none --outdir /build/dist

FROM oven/bun:1.3-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8090

COPY --from=builder /build/dist/server.js /app/dist/server.js

RUN mkdir -p /app/data /app/logs /app/dist && chown -R bun:bun /app

USER bun

EXPOSE 8090

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8090/health || exit 1

CMD ["bun", "dist/server.js"]
