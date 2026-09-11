#!/bin/sh
set -eu

/filebrowser -d /database/filebrowser.db config init || true
/filebrowser -d /database/filebrowser.db config set --root /srv

if ! /filebrowser -d /database/filebrowser.db users update "$FILEBROWSER_ADMIN_USER" --password "$FILEBROWSER_ADMIN_PASSWORD" --perm.admin; then
  /filebrowser -d /database/filebrowser.db users add "$FILEBROWSER_ADMIN_USER" "$FILEBROWSER_ADMIN_PASSWORD" --perm.admin
fi

exec /filebrowser -d /database/filebrowser.db --address 0.0.0.0 --port 80 --root /srv
