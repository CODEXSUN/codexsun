FROM golang:1.23-bookworm AS build
WORKDIR /src
COPY apps/cxforge/go.mod ./
COPY apps/cxforge/cmd ./cmd
COPY apps/cxforge/internal ./internal
RUN go test ./... && CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /out/cxforge ./cmd/cxforge

FROM golang:1.23-alpine
ARG CXFORGE_VERSION=dev
LABEL org.opencontainers.image.title="CXForge" \
      org.opencontainers.image.description="Isolated coding worker server" \
      org.opencontainers.image.version="${CXFORGE_VERSION}" \
      org.opencontainers.image.source="https://github.com/codexsun/codexsun"
ENV CXFORGE_VERSION=${CXFORGE_VERSION}
RUN apk add --no-cache git make nodejs npm python3 && addgroup -S cxforge && adduser -S -G cxforge cxforge && mkdir -p /workspace/.cache/go-build /workspace/.cache/go-mod
COPY --from=build /out/cxforge /usr/local/bin/cxforge
RUN chown -R cxforge:cxforge /workspace
ENV GOCACHE=/workspace/.cache/go-build GOMODCACHE=/workspace/.cache/go-mod
USER cxforge
WORKDIR /workspace
EXPOSE 6400 7300 7301 7302 7303
ENTRYPOINT ["/usr/local/bin/cxforge"]
