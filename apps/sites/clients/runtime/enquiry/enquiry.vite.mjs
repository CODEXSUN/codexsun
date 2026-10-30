import { resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { ClientContentStore } from "../content/content-store.mjs";
import { enquiryModule, submitEnquiry } from "./index.mjs";
export function clientEnquiryPlugin(root, slug, uuid, dataDirectory) {
  return {
    name: "codexsun-sites-local-enquiries",
    configureServer(server) {
      const identity = uuid || { logicx: "c0de0002", ramutex: "c0de0004", tenkasisports: "c0de0006" }[slug];
      if (!identity) return;
      const directory = dataDirectory || resolve(root, "storage/sites-data/manual", slug, identity);
      mkdirSync(directory, { recursive: true });
      const store = new ClientContentStore(resolve(directory, "content.sqlite"), identity);
      const service = enquiryModule(store.database);
      const cleanup = setInterval(() => service.expire(), 3600000);
      cleanup.unref();
      server.httpServer?.once("close", () => {
        clearInterval(cleanup);
        store.close();
      });
      server.middlewares.use("/content/v1/enquiries", async (request, response) => {
        const port = server.config.server.port;
        const allowed = [`http://127.0.0.1:${port}`, `http://localhost:${port}`];
        if (request.method !== "POST") {
          response.writeHead(405);
          return response.end();
        }
        try {
          await submitEnquiry(request, response, {
            origin: allowed.includes(request.headers.origin) ? request.headers.origin : allowed[0],
            service,
            address: request.socket.remoteAddress || "unknown"
          });
        } catch (error) {
          response.writeHead(error.status || 500, {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          });
          response.end(
            JSON.stringify({
              success: false,
              error: {
                message: error.status ? error.message : "Could not save the enquiry.",
                fields: error.fields
              }
            })
          );
        }
      });
    }
  };
}
