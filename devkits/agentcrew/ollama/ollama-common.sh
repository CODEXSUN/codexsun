#!/usr/bin/env bash
# Shared lifecycle implementation. Invoke one of the three public scripts.

main() {
  local action="$1"
  shift
  local stack_dir env_file gpu=false pull_models=false purge=false confirmed=false
  stack_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.container" && pwd)"
  env_file="$stack_dir/.env"
  while (($#)); do
    case "$1" in
      --gpu) gpu=true ;;
      --pull-models) pull_models=true ;;
      --purge-data) purge=true ;;
      --confirm-cx-agentcrew) confirmed=true ;;
      --help|-h) usage "$action"; return ;;
      *) printf 'Unknown option: %s\n' "$1" >&2; usage "$action"; return 2 ;;
    esac
    shift
  done
  if [[ "$action" != drop && ( "$purge" == true || "$confirmed" == true ) ]]; then
    printf 'Data removal flags are supported only by ollama-drop.sh.\n' >&2
    return 2
  fi
  if [[ "$action" == drop && "$pull_models" == true ]]; then
    printf 'Model downloads are not supported by ollama-drop.sh.\n' >&2
    return 2
  fi
  if [[ "$purge" != "$confirmed" ]]; then
    printf 'Purge requires both --purge-data and --confirm-cx-agentcrew.\n' >&2
    return 2
  fi
  command -v docker >/dev/null || { printf 'Install Docker with Compose v2 first.\n' >&2; return 1; }
  docker info >/dev/null
  docker compose version >/dev/null
  if [[ ! -f "$env_file" ]]; then
    if [[ "$action" == setup ]]; then
      (umask 077; cp -- "$stack_dir/.env.example" "$env_file")
    fi
    printf 'Configure %s with a random AGENTCREW_TOKEN of at least 32 characters, then retry.\n' "$env_file" >&2
    return 1
  fi
  local -a compose=(docker compose --project-name cx-agentcrew --env-file "$env_file" -f "$stack_dir/compose.yml")
  if [[ "$gpu" == true ]]; then compose+=(-f "$stack_dir/compose.gpu.yml"); fi
  "${compose[@]}" config --quiet
  if [[ "$action" == drop ]]; then
    drop_stack "$purge" "${compose[@]}"
    return
  fi
  ensure_network
  "${compose[@]}" pull ollama qdrant
  "${compose[@]}" build --pull api web
  "${compose[@]}" up -d --wait --wait-timeout 180
  if [[ "$pull_models" == true ]]; then download_models "${compose[@]}"; fi
  "${compose[@]}" ps
  printf 'Stack ready. Open the configured loopback web port (default http://127.0.0.1:6411).\n'
  printf 'Use --pull-models to install or refresh models. Model inference is not tested by this script.\n'
}

usage() {
  printf 'Usage: bash ollama-%s.sh [--gpu] [--pull-models]\n' "$1"
  printf 'Drop only: [--gpu] [--purge-data --confirm-cx-agentcrew]\n'
  printf 'Setup/update pull service images, rebuild application images, and wait for startup.\n'
  printf 'Model downloads require --pull-models. Drop preserves data unless both purge flags are supplied.\n'
}

ensure_network() {
  if ! docker network inspect codexsun-network >/dev/null 2>&1; then
    # A concurrent setup may create the network between inspection and creation.
    docker network create codexsun-network >/dev/null || docker network inspect codexsun-network >/dev/null
  fi
}

download_models() {
  local model embedding_model
  model="$("$@" exec -T api node -p 'process.env.AGENTCREW_MODEL')"
  embedding_model="$("$@" exec -T api node -p 'process.env.AGENTCREW_EMBED_MODEL')"
  model="${model//$'\r'/}"
  embedding_model="${embedding_model//$'\r'/}"
  [[ "$model" =~ ^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$ && "$embedding_model" =~ ^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$ ]] || {
    printf 'Invalid configured model name.\n' >&2; return 1;
  }
  "$@" exec -T ollama ollama pull "$model"
  "$@" exec -T ollama ollama pull "$embedding_model"
}

drop_stack() {
  local purge="$1"
  shift
  if [[ "$purge" == true ]]; then
    printf 'Deleting AgentCrew model, vector, and task volumes. Recovery requires your backup.\n'
    "$@" down --volumes
  else
    "$@" down
  fi
  printf 'AgentCrew stopped. Shared codexsun-network, images, build cache, and environment file are preserved.\n'
}
