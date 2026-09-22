# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build

ARG ZUNO_VERSION=development

WORKDIR /build

COPY . .

# npm can retain the host platform optional-dependency selection in a cached
# layer. Install the Linux binary explicitly so Vite's Lightning CSS build is
# reproducible in the container.
RUN npm ci --include=optional \
  && npm install --no-save --no-package-lock --ignore-scripts lightningcss-linux-x64-gnu@1.32.0

ENV VITE_ZUNO_API_URL=""
ENV VITE_ZUNO_VERSION=${ZUNO_VERSION}
# The root .env is intentionally excluded from Docker contexts. The shared
# workspace catalog still needs its local port map at compile time.
ENV VITE_PLATFORM_WEB_URL=6101 \
  VITE_UIUX_WEB_URL=6102 \
  VITE_ZETRO_WEB_URL=6131 \
  VITE_DOCX_WEB_URL=6201 \
  VITE_QCAFE_WEB_URL=6221 \
  VITE_CRM_WEB_URL=6231 \
  VITE_HIMSX_WEB_URL=6241 \
  VITE_LMS_WEB_URL=6251 \
  VITE_SITES_WEB_URL=6261 \
  VITE_ORSHIP_WEB_URL=6301 \
  VITE_CXFORGE_WEB_URL=6401 \
  VITE_ZUNO_WEB_URL=6411

RUN npm run build --workspace @codexsun/zuno-api \
  && npm run build --workspace @codexsun/zuno-web

FROM node:22-bookworm-slim AS api-runtime-dependencies

WORKDIR /runtime

RUN npm init -y \
  && npm install --omit=dev --ignore-scripts @fastify/swagger-ui@6.1.1

FROM docker:29-cli AS docker-cli

FROM node:22-bookworm-slim AS api

ARG ZUNO_VERSION=development

LABEL org.opencontainers.image.title="Zuno API" \
  org.opencontainers.image.version="${ZUNO_VERSION}"

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker-cli /usr/local/libexec/docker/cli-plugins/docker-compose /usr/local/libexec/docker/cli-plugins/docker-compose
COPY --from=api-runtime-dependencies /runtime/node_modules /app/node_modules
COPY --from=build /build/dist/zuno/api/server.js /app/dist/zuno/api/server.js
COPY --from=build /build/registry /app/registry

RUN mkdir -p /app/apps/devkits/zuno/api /data

WORKDIR /app/apps/devkits/zuno/api

ENV DOCKER_CONFIG=/tmp/docker
ENV NODE_ENV=production

EXPOSE 6410

CMD ["node", "../../../dist/zuno/api/server.js"]

FROM nginx:1.27-alpine AS web

ARG ZUNO_VERSION=development

LABEL org.opencontainers.image.title="Zuno Web" \
  org.opencontainers.image.version="${ZUNO_VERSION}"

COPY apps/devkits/zuno/.container/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist/apps/devkits/zuno/web /usr/share/nginx/html

EXPOSE 6411
