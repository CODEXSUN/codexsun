# syntax=docker/dockerfile:1

FROM node:26-bookworm-slim AS build

WORKDIR /workspace

COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY apps/himsx ./apps/himsx
COPY packages ./packages
COPY core/registry ./core/registry
COPY tools ./tools

RUN npm install --ignore-scripts --include=optional --package-lock=false \
  && npm install --ignore-scripts --no-save lightningcss-linux-x64-gnu@1.32.0
RUN npm run build:deployment --workspace @codexsun/himsx-api
RUN npm run build --workspace @codexsun/himsx-web

FROM node:26-bookworm-slim AS api

WORKDIR /workspace/apps/himsx/api

ENV NODE_ENV=production
ENV CODEXSUN_DEPLOYMENT_PROFILE=development

COPY --from=build /workspace/dist/apps/himsx/api/server.js /workspace/dist/apps/himsx/api/server.js
COPY --from=build /workspace/dist/apps/himsx/api/deployment-prepare.js /workspace/dist/apps/himsx/api/deployment-prepare.js
COPY --from=build /workspace/node_modules/@fastify/swagger-ui/static /workspace/dist/apps/himsx/api/static
COPY --from=build /workspace/node_modules/@fastify/swagger-ui/static /workspace/dist/apps/himsx/static
COPY --from=build /workspace/core/registry /workspace/core/registry

RUN mkdir -p /workspace/storage/apps/himsx/private/data \
  && chown -R node:node /workspace/storage

USER node

EXPOSE 6240
CMD ["node", "../../../dist/apps/himsx/api/server.js"]

FROM nginx:1.27-alpine AS web

COPY apps/himsx/.container/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/apps/himsx/web /usr/share/nginx/html

EXPOSE 80
