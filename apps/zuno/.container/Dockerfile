# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build

ARG ZUNO_VERSION=development

WORKDIR /build

COPY . .

RUN npm ci

ENV VITE_ZUNO_API_URL=""
ENV VITE_ZUNO_VERSION=${ZUNO_VERSION}

RUN npm run build --workspace @codexsun/zuno-api \
  && npm run build --workspace @codexsun/zuno-web

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
COPY --from=build /build/node_modules /app/node_modules
COPY --from=build /build/dist/zuno/api/server.js /app/dist/zuno/api/server.js
COPY --from=build /build/registry /app/registry

RUN mkdir -p /app/apps/zuno/api /data

WORKDIR /app/apps/zuno/api

ENV DOCKER_CONFIG=/tmp/docker
ENV NODE_ENV=production

EXPOSE 6410

CMD ["node", "../../../dist/zuno/api/server.js"]

FROM nginx:1.27-alpine AS web

ARG ZUNO_VERSION=development

LABEL org.opencontainers.image.title="Zuno Web" \
  org.opencontainers.image.version="${ZUNO_VERSION}"

COPY apps/zuno/.container/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist/apps/zuno/web /usr/share/nginx/html

EXPOSE 6411
