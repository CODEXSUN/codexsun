#!/usr/bin/env sh
set -eu

source_dir="/opt/codexsun-web/platform"

rm -rf /usr/share/nginx/html/*
cp -a "$source_dir/." /usr/share/nginx/html/
exec nginx -g 'daemon off;'
