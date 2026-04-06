FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends git nano sudo ca-certificates openssh-client \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/codexsun/app

COPY package.json package-lock.json ./
RUN npm ci

COPY apps ./apps
COPY public ./public
COPY ASSIST ./ASSIST
COPY .container ./.container
COPY components.json ./
COPY eslint.config.js ./
COPY index.html ./
COPY playwright.config.ts ./
COPY README.md ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY .env.example ./

RUN cp .env.example .env
RUN rm -rf ./public/storage && mkdir -p ./public/storage
RUN mkdir -p /opt/codexsun/runtime/storage/backups/database
RUN chmod +x ./.container/entrypoint.sh
RUN npm run build:api && npm run build:web

EXPOSE 4000

VOLUME ["/opt/codexsun/runtime"]

ENTRYPOINT ["./.container/entrypoint.sh"]
