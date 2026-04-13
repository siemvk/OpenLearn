FROM oven/bun:1.3.10-alpine AS development-dependencies-env
WORKDIR /app
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

FROM oven/bun:1.3.10-alpine AS production-dependencies-env
WORKDIR /app
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3.10-alpine AS build-env
WORKDIR /app
COPY package.json bun.lock ./
COPY prisma ./prisma
COPY --from=development-dependencies-env /app/node_modules ./node_modules
RUN bunx prisma generate
COPY . .
RUN bun run build

FROM oven/bun:1.3.10-alpine
WORKDIR /app
COPY package.json bun.lock ./
COPY prisma ./prisma
COPY --from=production-dependencies-env /app/node_modules ./node_modules
COPY --from=build-env /app/build ./build
COPY --from=build-env /app/generated ./generated
CMD ["sh", "-c", "bunx prisma db push --accept-data-loss && bun run start"]