ARG NODE_RUNTIME_VERSION=26.5.0
FROM node:${NODE_RUNTIME_VERSION}-bookworm-slim AS build

WORKDIR /app
RUN npm install --global npm@12.2.0
COPY . .
RUN npm ci && npm run build

FROM node:${NODE_RUNTIME_VERSION}-bookworm-slim AS api
WORKDIR /app
RUN npm install --global npm@12.2.0
ENV NODE_ENV=production
ENV CODEXSUN_ZETRO_CODEX_CLI_PATH=/opt/codexsun-codex-cli/node_modules/.bin/codex
ENV CODEXSUN_ZETRO_CODEX_HOME_ROOT=/var/lib/codexsun/zetro-codex
ENV PATH="/opt/codexsun-codex-cli/node_modules/.bin:${PATH}"
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app /app
COPY .container/demo/api-entrypoint.sh /usr/local/bin/codexsun-demo-api-entrypoint
RUN chmod +x /usr/local/bin/codexsun-demo-api-entrypoint
EXPOSE 17210
HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=10 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PLATFORM_API_PORT+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["codexsun-demo-api-entrypoint"]
CMD ["npm", "run", "start:api:production"]

FROM nginx:1.28-alpine AS web
COPY .container/demo/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/apps/platform/web /usr/share/nginx/html
COPY --from=build /app/dist/apps/qcafe/web /usr/share/nginx/qcafe
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1
