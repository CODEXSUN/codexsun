FROM node:24-bookworm-slim AS build
WORKDIR /workspace
COPY package.json package-lock.json tsconfig.base.json .env.example ./
COPY packages ./packages
COPY devkits/agentcrew/api/package.json ./devkits/agentcrew/api/package.json
COPY devkits/agentcrew/web/package.json ./devkits/agentcrew/web/package.json
RUN npm ci --ignore-scripts --include=optional
COPY devkits/agentcrew ./devkits/agentcrew
COPY core/registry/applications ./core/registry/applications
RUN npm run build --workspace @codexsun/agentcrew-api && npm run build --workspace @codexsun/agentcrew-web

FROM build AS api
ENV AGENTCREW_HOST=0.0.0.0
RUN mkdir -p /workspace/storage/apps/private/agentcrew/assistant && chown -R node:node /workspace/storage
USER node
EXPOSE 6410
CMD ["node", "--import", "tsx", "dist/devkits/agentcrew/api/server.js"]

FROM nginxinc/nginx-unprivileged:stable-alpine AS web
COPY --from=build /workspace/dist/devkits/agentcrew/web /usr/share/nginx/html
COPY devkits/agentcrew/ollama/.container/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
