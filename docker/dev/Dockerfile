# ==============================================================================
# SG Forge Submodule - Goals Micro-App (Dev Environment)
# Bun Runtime with Watch Mode for Rapid Local Development
# ==============================================================================

FROM oven/bun:1.3-alpine

WORKDIR /app

ENV NODE_ENV=development
ENV PORT=8090

COPY package.json bun.lock* tsconfig.json ./
RUN if [ -f bun.lock ] || [ -f bun.lockb ] || grep -q '"dependencies": {' package.json; then bun install 2>/dev/null || true; fi

COPY src/ ./src/
COPY data/ ./data/
COPY logs/ ./logs/

EXPOSE 8090

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8090/health || exit 1

CMD ["bun", "--watch", "src/server.ts"]
