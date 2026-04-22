FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json ./
COPY package-lock.json* ./
COPY cxmedia ./cxmedia

RUN npm ci --ignore-scripts
RUN npm run cxmedia:build

FROM dxflrs/garage:v2.2.0 AS garage

FROM node:22-bookworm-slim
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv python3-pip libjpeg62-turbo libjpeg62-turbo-dev zlib1g zlib1g-dev libwebp-dev ca-certificates \
  && python3 -m venv /opt/thumbor \
  && /opt/thumbor/bin/pip install --no-cache-dir thumbor==7.7.7 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=garage /garage /garage
COPY --from=build /app/build/cxmedia ./build/cxmedia
COPY --from=build /app/cxmedia/public ./cxmedia/public
COPY --from=build /app/cxmedia/.env.example ./cxmedia/.env.example
COPY --from=build /app/cxmedia/deploy/container/start-stack.mjs ./cxmedia/deploy/container/start-stack.mjs
COPY --from=build /app/cxmedia/deploy/garage-config.toml /etc/garage.toml

RUN mkdir -p /var/lib/garage/meta /var/lib/garage/data /app/cxmedia/data

EXPOSE 4100

CMD ["node", "cxmedia/deploy/container/start-stack.mjs"]
