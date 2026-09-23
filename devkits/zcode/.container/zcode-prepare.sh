#!/usr/bin/env sh
set -eu

workspace=/home/workspace/codexsun
repo_url=https://github.com/CODEXSUN/codexsun.git

if [ "$(id -u)" = 0 ]; then
  chown openvscode-server:openvscode-server /home/workspace
  exec runuser -u openvscode-server -- sh /opt/zcode-prepare.sh
fi

if [ -L "$workspace" ]; then
  printf 'Zcode workspace cannot be a symlink: %s\n' "$workspace" >&2
  exit 1
fi

if [ -d "$workspace" ] && [ -z "$(ls -A "$workspace")" ]; then
  rmdir "$workspace"
fi

if [ ! -e "$workspace" ]; then
  git clone --depth 1 "$repo_url" "$workspace"
elif [ ! -d "$workspace/.git" ]; then
  printf 'Zcode workspace exists but is not a Git checkout: %s\n' "$workspace" >&2
  exit 1
fi

actual_url="$(git -C "$workspace" remote get-url origin)"
if [ "$actual_url" != "$repo_url" ]; then
  printf 'Zcode workspace origin does not match %s\n' "$repo_url" >&2
  exit 1
fi

if [ -e "$workspace/.git/index.lock" ] || [ ! -f "$workspace/package-lock.json" ]; then
  printf 'Zcode checkout is incomplete: %s\n' "$workspace" >&2
  exit 1
fi

git -C "$workspace" config core.filemode false
printf 'Zcode checkout ready: %s\n' "$workspace"
