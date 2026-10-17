import publication from "../../../../dist/apps/sites/cloudflare/logicx/publication.json";
import { createSiteWorker } from "./worker.mjs";

export default createSiteWorker(publication, "https://logicx.codexsun.com");
