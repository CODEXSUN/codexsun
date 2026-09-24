# syntax=docker/dockerfile:1.7
FROM node:24.4.0-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
WORKDIR /usr/src/dokploy
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ git pkg-config libsecret-1-dev && rm -rf /var/lib/apt/lists/*
RUN --mount=type=cache,id=dokploy-pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter=@dokploy/server build && pnpm --filter=./apps/dokploy run build
RUN pnpm --filter=./apps/dokploy --prod deploy --legacy /opt/dokploy
RUN cp -R apps/dokploy/.next /opt/dokploy/.next && cp -R apps/dokploy/dist /opt/dokploy/dist
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends tini curl unzip zip apache2-utils iproute2 rsync git-lfs ca-certificates && git lfs install && rm -rf /var/lib/apt/lists/*
COPY --from=build /opt/dokploy/ ./
COPY --from=build /usr/src/dokploy/apps/dokploy/drizzle ./drizzle
COPY --from=build /usr/src/dokploy/apps/dokploy/next.config.mjs ./next.config.mjs
COPY --from=build /usr/src/dokploy/apps/dokploy/public ./public
COPY --from=build /usr/src/dokploy/apps/dokploy/components.json ./components.json
RUN curl -fsSL https://get.docker.com -o /tmp/docker.sh && sh /tmp/docker.sh --version 28.5.2 && rm /tmp/docker.sh
RUN curl -fsSL https://nixpacks.com/install.sh | bash && curl -fsSL https://railpack.com/install.sh | bash
COPY --from=buildpacksio/pack:0.39.1 /usr/local/bin/pack /usr/local/bin/pack
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 CMD curl -fsS http://127.0.0.1:3000/api/trpc/settings.health || exit 1
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "node -r dotenv/config dist/wait-for-postgres.mjs && node -r dotenv/config dist/migration.mjs && exec node -r dotenv/config dist/server.mjs"]
