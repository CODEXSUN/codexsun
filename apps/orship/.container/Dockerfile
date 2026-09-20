# syntax=docker/dockerfile:1

FROM node:26-bookworm-slim AS build

WORKDIR /workspace

ENV VITE_PLATFORM_WEB_URL=6101
ENV VITE_UIUX_WEB_URL=6102
ENV VITE_ZETRO_WEB_URL=6131
ENV VITE_DOCX_WEB_URL=6201
ENV VITE_QCAFE_WEB_URL=6221
ENV VITE_CRM_WEB_URL=6231
ENV VITE_HIMSX_WEB_URL=6241
ENV VITE_LMS_WEB_URL=6251
ENV VITE_SITES_WEB_URL=6261
ENV VITE_ORSHIP_WEB_URL=6301
ENV VITE_CXFORGE_WEB_URL=6401
ENV VITE_ZUNO_WEB_URL=6411

COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY apps ./apps
COPY packages ./packages
COPY registry ./registry
COPY tools ./tools

RUN npm ci --ignore-scripts --include=optional \
  && npm install --ignore-scripts --no-save lightningcss-linux-x64-gnu@1.32.0
RUN npm run build --workspace @codexsun/orship-api
RUN npm run build --workspace @codexsun/orship-web

FROM golang:1.23-bookworm AS docker-manager-build
WORKDIR /src
COPY apps/orship/docker/go.mod ./go.mod
COPY apps/orship/docker/cmd ./cmd
COPY apps/orship/docker/internal ./internal
RUN CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /out/orship-docker ./cmd/orship-docker

FROM alpine:3.21 AS docker-manager
COPY --from=docker-manager-build /out/orship-docker /usr/local/bin/orship-docker
COPY apps/orship/docker/samples /etc/orship/samples
EXPOSE 6302
ENTRYPOINT ["/usr/local/bin/orship-docker"]

FROM node:26-bookworm-slim AS api

WORKDIR /workspace/apps/orship/api
ENV NODE_ENV=production
ENV CODEXSUN_DEPLOYMENT_PROFILE=development

COPY --from=build /workspace/dist/orship/api/server.js /workspace/dist/orship/api/server.js
COPY --from=build /workspace/node_modules/@fastify/swagger-ui/static /workspace/dist/orship/api/static
COPY --from=build /workspace/node_modules/@fastify/swagger-ui/static /workspace/dist/orship/static
COPY --from=build /workspace/registry /workspace/registry

RUN mkdir -p /workspace/storage/apps/orship/private/data

EXPOSE 6300
CMD ["node", "../../../dist/orship/api/server.js"]

FROM nginx:1.27-alpine AS web

COPY apps/orship/.container/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/apps/orship/web /usr/share/nginx/html

EXPOSE 80
