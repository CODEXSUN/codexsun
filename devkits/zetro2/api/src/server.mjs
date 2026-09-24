import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.mjs";

const envPath = fileURLToPath(new URL("../.app.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
const port = Number(process.env.ZETRO2_API_PORT ?? 6300);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid ZETRO2_API_PORT.");
const host = process.env.PLATFORM_HOST ?? "127.0.0.1";
const server = createApp();
server.listen(port, host, () => console.log(`Zetro2 API listening on ${host}:${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => server.close());
