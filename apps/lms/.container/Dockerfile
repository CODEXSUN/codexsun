# syntax=docker/dockerfile:1

FROM node:26-bookworm-slim AS build

WORKDIR /workspace

COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY apps/lms ./apps/lms
COPY packages ./packages
COPY core/registry ./core/registry
COPY tools ./tools

RUN npm install --ignore-scripts --include=optional --package-lock=false \
  && npm install --ignore-scripts --no-save lightningcss-linux-x64-gnu@1.32.0
RUN npm run build:deployment --workspace @codexsun/lms-api
RUN npm run build --workspace @codexsun/lms-web

FROM node:26-bookworm-slim AS api

WORKDIR /workspace/apps/lms/api

ENV NODE_ENV=production
ENV CODEXSUN_DEPLOYMENT_PROFILE=development

COPY --from=build /workspace/dist/apps/lms/api/server.js /workspace/dist/apps/lms/api/server.js
COPY --from=build /workspace/dist/apps/lms/api/deployment-prepare.js /workspace/dist/apps/lms/api/deployment-prepare.js
COPY --from=build /workspace/node_modules/@fastify/swagger-ui/static /workspace/dist/apps/lms/api/static
COPY --from=build /workspace/node_modules/@fastify/swagger-ui/static /workspace/dist/apps/lms/static
COPY --from=build /workspace/core/registry /workspace/core/registry

RUN mkdir -p /workspace/storage/apps/lms/private/data \
  && chown -R node:node /workspace/storage

USER node

EXPOSE 6250
CMD ["node", "../../../dist/apps/lms/api/server.js"]

FROM nginx:1.27-alpine AS web

COPY apps/lms/.container/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/apps/lms/web /usr/share/nginx/html

EXPOSE 80
