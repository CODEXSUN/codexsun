#!/usr/bin/env sh

zcode_select_env() {
  profile="${1:-}"
  if [ -n "$profile" ]; then
    case "$profile" in
      *[!a-z0-9-]*|-*|*-)
        printf 'Profile must use lowercase letters, digits, and internal hyphens.\n' >&2
        return 2
        ;;
    esac
    zcode_env_file="$script_dir/.env.$profile"
    [ -f "$zcode_env_file" ] || {
      printf 'Missing Zcode profile: %s\n' "$zcode_env_file" >&2
      return 2
    }
    project_name="$(sed -n 's/^ZCODE_PROJECT_NAME=//p' "$zcode_env_file" | tail -n 1 | tr -d '\r')"
    if [ "$project_name" != "zcode-$profile" ]; then
      printf 'Profile %s must set ZCODE_PROJECT_NAME=zcode-%s.\n' "$profile" "$profile" >&2
      return 2
    fi
    seen_ports=' '
    for key in ZCODE_EDITOR_PORT ZCODE_ZBROWSER_PORT \
      ZCODE_PREVIEW_PORT_1 ZCODE_PREVIEW_PORT_2 ZCODE_PREVIEW_PORT_3 \
      ZCODE_PREVIEW_PORT_4 ZCODE_PREVIEW_PORT_5 ZCODE_PREVIEW_PORT_6 \
      ZCODE_PREVIEW_PORT_7 ZCODE_PREVIEW_PORT_8 ZCODE_PREVIEW_PORT_9; do
      port="$(sed -n "s/^$key=//p" "$zcode_env_file" | tail -n 1 | tr -d '\r')"
      case "$port" in
        ''|*[!0-9]*)
          printf '%s must be a numeric host port.\n' "$key" >&2
          return 2
          ;;
      esac
      if [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
        printf '%s must be between 1 and 65535.\n' "$key" >&2
        return 2
      fi
      case "$seen_ports" in
        *" $port "*)
          printf 'Profile host ports must be unique: %s.\n' "$port" >&2
          return 2
          ;;
      esac
      seen_ports="$seen_ports$port "
    done
  else
    zcode_env_file="$script_dir/.env"
  fi
}
