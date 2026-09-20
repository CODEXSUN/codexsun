#!/usr/bin/env sh
set -eu
docker network inspect codexsun-network >/dev/null 2>&1 || docker network create codexsun-network
docker compose -p cxforgefresh -f apps/cxforge/.container/compose.yml up -d --build
echo "CXForge is available at http://127.0.0.1:6400"
