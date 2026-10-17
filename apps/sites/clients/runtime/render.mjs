import { renderSite } from "../src/ssr.tsx";
import { documentHead, publicRoutes } from "./seo.mjs";
export function renderPublicDocument(snapshot, path, template, origin) {
  const publication = {
    siteUuid: snapshot.siteUuid,
    siteSlug: snapshot.siteSlug,
    content: snapshot.content,
    blogs: snapshot.blogs
  };
  const bootstrap = JSON.stringify(publication).replace(/</g, "\\u003c");
  const head =
    documentHead(snapshot, path, origin) +
    (publicRoutes(snapshot).includes(path) ? "" : '<meta name="robots" content="noindex">');
  const clean = template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*>/g, "");
  return clean
    .replace("</head>", head + "</head>")
    .replace(
      '<div id="root"></div>',
      `<div id="root">${renderSite(publication, path, origin)}</div><script id="codexsun-sites-publication" type="application/json">${bootstrap}</script>`
    );
}
