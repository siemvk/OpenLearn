# ------------------------------------------------------------
# GUYS ALSJEBLIEFT NIET WIJZIGEN HET WERKT OKE
# ------------------------------------------------------------

FROM node:lts AS builder

WORKDIR /app

RUN npm install -g pnpm typescript

COPY package.json pnpm-lock.yaml ./
COPY prisma/schema.prisma ./prisma/
COPY .git ./.git

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

RUN pnpm exec tsup src/main.ts src/hono-server.ts --out-dir dist --format cjs

FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

COPY --from=builder /app/dist/hono-server.js ./dist/hono-server.js
COPY --from=builder /app/dist/main.js ./dist/main.js

EXPOSE 3000
ENV NODE_ENV=production

CMD ["-r", "tsconfig-paths/register", "dist/main.js"]