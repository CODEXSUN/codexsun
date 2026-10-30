import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { verifyPublication } from "@codexsun/sites-api/delivery-integrity";
export function textilePublicationPlugin(
  snapshotFile: string | undefined,
  command: string
): Plugin {
  if (command !== "build") return { name: "sites-textile-publication-development" };
  if (!snapshotFile)
    throw new Error(
      "Set CODEXSUN_SITES_TIRUPURCONNECT_SNAPSHOT to the authenticated Sites publication export before building."
    );
  const raw = JSON.parse(readFileSync(resolve(snapshotFile), "utf8"));
  const snapshot = verifyPublication(raw.success ? raw.data : raw);
  if (
    snapshot.siteSlug !== "tirupurconnect" ||
    snapshot.siteUuid !== "e303865e" ||
    snapshot.content.profile.domain !== "tirupurconnect.com" ||
    !snapshot.content.textile
  )
    throw new Error("The Tirupur Connect publication identity does not match this deployment.");
  const data = {
    siteUuid: snapshot.siteUuid,
    siteSlug: snapshot.siteSlug,
    content: snapshot.content,
    blogs: snapshot.blogs
  };
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  return {
    name: "sites-textile-published-content",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace(
          "</head>",
          `<script type="application/json" id="codexsun-sites-publication">${json}</script></head>`
        );
      }
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "__sites-content.json",
        source: JSON.stringify({ success: true, data })
      });
    }
  };
}
