# ---- Build Stage ----
FROM node:lts AS builder

WORKDIR /app

# Install pnpm & typescript globally (needed for build scripts)
RUN npm install -g pnpm typescript

# Accept the git-info build-arg and export it as env so Next sees it during build
ARG NEXT_PUBLIC_GITINF="unknown"
ENV NEXT_PUBLIC_GITINF=$NEXT_PUBLIC_GITINF

# Copy only dependency-related files for layer caching
COPY package.json pnpm-lock.yaml ./
COPY prisma/schema.prisma ./prisma/
COPY .git ./.git

# Install system deps and git (git is needed if you rely on git commands during build)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Install node deps
RUN pnpm install --frozen-lockfile

# Copy rest of source
COPY . .

# Ensure there is a fallback .env.production (useful if NEXT_PUBLIC_GITINF not provided)
RUN if [ ! -f .env.production ]; then echo "NEXT_PUBLIC_GITINF=${NEXT_PUBLIC_GITINF}" > .env.production; fi

# Build the app (Next.js build and others)
RUN pnpm build

# Bundle server files with tsup to rewrite path aliases
RUN pnpm exec tsup src/main.ts src/hono-server.ts --out-dir dist --format cjs

## ---- Production Stage ----
FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /app

# Copy only the runtime artifacts from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy compiled server files
COPY --from=builder /app/dist/hono-server.js ./dist/hono-server.js
COPY --from=builder /app/dist/main.js ./dist/main.js

EXPOSE 3000
ENV NODE_ENV=production

# distroless requires the full command array; include `node` explicitly.
CMD ["node", "-r", "tsconfig-paths/register", "dist/main.js"]
