# syntax=docker/dockerfile:1

FROM node:26-bookworm-slim AS build

WORKDIR /workspace

# These are public local app ports used by the shared app switcher. Secrets stay outside the image.
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

COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY apps/crm ./apps/crm
COPY packages ./packages
COPY core/registry ./core/registry
COPY tools ./tools

RUN npm install --ignore-scripts --include=optional --package-lock=false \
  && npm install --ignore-scripts --no-save lightningcss-linux-x64-gnu@1.32.0
RUN npm run build:deployment --workspace @codexsun/crm-api
RUN npm run build --workspace @codexsun/crm-web

FROM node:26-bookworm-slim AS api

WORKDIR /workspace/apps/crm/api

ENV NODE_ENV=production
ENV CODEXSUN_DEPLOYMENT_PROFILE=development

COPY --from=build /workspace/dist/apps/crm/api/server.js /workspace/dist/apps/crm/api/server.js
COPY --from=build /workspace/dist/apps/crm/api/deployment-prepare.js /workspace/dist/apps/crm/api/deployment-prepare.js
COPY --from=build /workspace/node_modules/@fastify/swagger-ui/static /workspace/dist/apps/crm/api/static
COPY --from=build /workspace/node_modules/@fastify/swagger-ui/static /workspace/dist/apps/crm/static
COPY --from=build /workspace/core/registry /workspace/core/registry

RUN mkdir -p /workspace/storage/app/crm/private/data \
  && chown -R node:node /workspace/storage

USER node

EXPOSE 6230
CMD ["node", "../../../dist/apps/crm/api/server.js"]

FROM nginx:1.27-alpine AS web

COPY apps/crm/.container/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/apps/crm/web /usr/share/nginx/html

EXPOSE 80
