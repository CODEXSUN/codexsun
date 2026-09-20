FROM golang:1.23-bookworm AS build
WORKDIR /src
COPY apps/cxforge/go.mod ./
COPY apps/cxforge/cmd ./cmd
COPY apps/cxforge/internal ./internal
RUN go test ./... && CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' -o /out/cxforge ./cmd/cxforge

FROM alpine:3.21
RUN addgroup -S cxforge && adduser -S -G cxforge cxforge && mkdir -p /workspace
COPY --from=build /out/cxforge /usr/local/bin/cxforge
RUN chown -R cxforge:cxforge /workspace
USER cxforge
WORKDIR /workspace
EXPOSE 6400
VOLUME ["/workspace"]
ENTRYPOINT ["/usr/local/bin/cxforge"]
