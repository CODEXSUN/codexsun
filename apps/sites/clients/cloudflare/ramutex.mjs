import publication from "../../../../dist/apps/sites/cloudflare/ramutex/publication.json";
import { createSiteWorker } from "./worker.mjs";

export default createSiteWorker(publication, "https://ramutex.codexsun.com");
