# App Environment Template

```text
# Copy this file to apps/<app>/.app.env. Do not commit the copied file.
APP_NAME=
API_PORT=
WEB_URL=
API_URL=
# App-owned database override. Leave empty to use root DB_* settings.
DATABASE_URL=
REDIS_URL=
STORAGE_NAMESPACE=

# Development identity controls. Production ignores auto-login.
APP_MODE=development
AUTO_LOGIN=0
AUTO_LOGIN_DESK=user
```

Add only app-owned variables. Put shared infrastructure defaults in root `.env`.
Set `AUTO_LOGIN_DESK` to `user`, `admin`, or `super-admin`. When `AUTO_LOGIN=1`,
the development login endpoint seeds and opens only that desk.
