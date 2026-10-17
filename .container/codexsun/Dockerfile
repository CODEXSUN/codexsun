ARG NODE_RUNTIME_VERSION=26.5.0
ARG NGINX_BASE_IMAGE=nginx:1.28-alpine

FROM node:${NODE_RUNTIME_VERSION}-bookworm-slim AS dependencies

ARG NPM_RUNTIME_VERSION
WORKDIR /app
RUN npm install --global npm@${NPM_RUNTIME_VERSION}
COPY package.json package-lock.json .npmrc tsconfig.json tsconfig.base.json turbo.json ./
COPY tools ./tools
COPY packages ./packages
COPY apps ./apps
COPY devkits ./devkits
RUN npm ci

FROM dependencies AS api-build
RUN npm run build -w @codexsun/framework \
  && npm run build -w @codexsun/accounts-api \
  && npm run build -w @codexsun/auditor-api \
  && npm run build -w @codexsun/billing-api \
  && npm run build -w @codexsun/chat-api \
  && npm run build -w @codexsun/codexsun-api \
  && npm run build -w @codexsun/core-api \
  && npm run build -w @codexsun/crm-api \
  && npm run build -w @codexsun/docs-api \
  && npm run build -w @codexsun/ecommerce-api \
  && npm run build -w @codexsun/frappe-api \
  && npm run build -w @codexsun/himsx-api \
  && npm run build -w @codexsun/hrms-api \
  && npm run build -w @codexsun/logicx-erp-api \
  && npm run build -w @codexsun/mail-api \
  && npm run build -w @codexsun/notes-api \
  && npm run build -w @codexsun/project-manager-api \
  && npm run build -w @codexsun/qcafe-api \
  && npm run build -w @codexsun/sites-api \
  && npm run build -w @codexsun/tconnect-api \
  && npm run build -w @codexsun/zetro-api \
  && npm run build -w @codexsun/zuno-api \
  && npm run build -w @codexsun/platform-api

FROM dependencies AS web-build
RUN npm run build -w @codexsun/framework \
  && npm run build -w @codexsun/platform-web

FROM dependencies AS shop-build
RUN npm run build -w @codexsun/ecommerce-storefront

FROM dependencies AS production-dependencies
RUN npm prune --omit=dev

FROM node:${NODE_RUNTIME_VERSION}-bookworm-slim AS api
ARG NPM_RUNTIME_VERSION
ARG PLATFORM_API_PORT
WORKDIR /app
RUN npm install --global npm@${NPM_RUNTIME_VERSION} \
  && apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates mariadb-client \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /storage/app/public /storage/public /storage/tenants /storage/backups/database /app/apps/platform/web/public \
  && ln -s /storage/tenants /app/storage \
  && touch /app/.env \
  && chown -R node:node /storage /app/.env /app/apps
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=api-build /app/packages/framework ./packages/framework
COPY --from=api-build /app/apps/qcafe/api ./apps/qcafe/api
COPY --from=api-build /app/dist ./dist
COPY tools/register-production-package-resolution.mjs ./tools/register-production-package-resolution.mjs
COPY .container/codexsun/api-entrypoint.sh /usr/local/bin/codexsun-api-entrypoint
RUN chmod +x /usr/local/bin/codexsun-api-entrypoint
ENV NODE_ENV=production
USER node
EXPOSE ${PLATFORM_API_PORT}
HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=10 CMD node -e "fetch('http://127.0.0.1:'+process.env.PLATFORM_API_PORT+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["codexsun-api-entrypoint"]

FROM ${NGINX_BASE_IMAGE} AS web
COPY .container/codexsun/nginx-web.conf /etc/nginx/templates/default.conf.template
COPY --from=web-build /app/dist/apps/platform/web /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=5 CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1

FROM ${NGINX_BASE_IMAGE} AS shop
COPY .container/codexsun/nginx-shop.conf /etc/nginx/templates/default.conf.template
COPY --from=shop-build /app/dist/apps/ecommerce/storefront /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=5 CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1
