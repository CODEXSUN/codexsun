FROM golang:1.23-bookworm AS build
WORKDIR /src
COPY devkits/cxforge/go.mod ./
COPY devkits/cxforge/cmd ./cmd
COPY devkits/cxforge/internal ./internal
RUN go test ./... && CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /out/cxforge ./cmd/cxforge

FROM golang:1.23-alpine
ARG CXFORGE_VERSION=dev
LABEL org.opencontainers.image.title="CXForge" \
      org.opencontainers.image.description="Isolated coding worker server" \
      org.opencontainers.image.version="${CXFORGE_VERSION}" \
      org.opencontainers.image.source="https://github.com/codexsun/codexsun"
ENV CXFORGE_VERSION=${CXFORGE_VERSION}
RUN apk add --no-cache git make nodejs npm python3 sqlite mariadb-client && addgroup -S cxforge && adduser -S -G cxforge cxforge && mkdir -p /workspace /var/lib/cxforge/cache/go-build /var/lib/cxforge/cache/go-mod
COPY --from=build /out/cxforge /usr/local/bin/cxforge
COPY devkits/cxforge/agent/zuno-migrations.ts devkits/cxforge/agent/zuno-preview.mjs /opt/cxforge/presets/
RUN chown -R cxforge:cxforge /workspace /var/lib/cxforge
ENV GOCACHE=/var/lib/cxforge/cache/go-build GOMODCACHE=/var/lib/cxforge/cache/go-mod
USER cxforge
WORKDIR /workspace
EXPOSE 6400 7300 7301 7302 7303
ENTRYPOINT ["/usr/local/bin/cxforge"]
