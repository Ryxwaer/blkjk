# syntax=docker/dockerfile:1.7

# ---------- builder ----------
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock* bun.lockb* ./
RUN bun install --frozen-lockfile || bun install

COPY . .

ENV NODE_ENV=production
RUN bun run build

# ---------- runtime ----------
FROM oven/bun:1-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000 \
    PORT=3000

COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
