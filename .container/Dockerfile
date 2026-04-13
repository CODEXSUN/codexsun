FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential ca-certificates dumb-init git python3 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/codexsun/app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY apps ./apps
COPY public ./public
COPY .container ./.container
COPY components.json ./
COPY index.html ./
COPY tsconfig.json ./
COPY tsconfig.server.json ./
COPY vite.config.ts ./
COPY .env.sample ./

ARG VITE_FRONTEND_TARGET=shop
ENV VITE_FRONTEND_TARGET=${VITE_FRONTEND_TARGET}

RUN mkdir -p /opt/codexsun/runtime/storage/backups/database
RUN chmod +x ./.container/entrypoint.sh
RUN npm run build

EXPOSE 4000

VOLUME ["/opt/codexsun/runtime"]

ENTRYPOINT ["dumb-init", "--", "./.container/entrypoint.sh"]
