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
RUN npm run build --workspace @codexsun/zetro-api
RUN npm run build --workspace @codexsun/zetro-web

FROM node:26-bookworm-slim AS api

WORKDIR /workspace/apps/zetro/api
ENV NODE_ENV=production
ENV CODEXSUN_DEPLOYMENT_PROFILE=development

COPY --from=build /workspace/dist/zetro/api/server.js /workspace/dist/zetro/api/server.js
COPY --from=build /workspace/registry /workspace/registry

RUN mkdir -p /workspace/storage/apps/private/zetro/runtime

EXPOSE 6130
CMD ["node", "../../../dist/zetro/api/server.js"]

FROM nginx:1.27-alpine AS web

COPY apps/zetro/.container/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/zetro/web /usr/share/nginx/html

EXPOSE 80
