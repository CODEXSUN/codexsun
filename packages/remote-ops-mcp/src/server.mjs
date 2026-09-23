import { loadConfig } from "./config.mjs";
import { createMcpServer, startStdio } from "./stdio-server.mjs";

const config = loadConfig();
await startStdio(createMcpServer({ config }));
