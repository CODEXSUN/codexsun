export function createWorkspaceDocument(html: string) {
  const head = html.slice(0, html.indexOf("</head>"));
  if (!/<script[^>]*type="module"[^>]*src=/.test(head)) {
    throw new Error("The built document must load its application entry from the head.");
  }
  return html
    .replace(/<link[^>]*id="public-home-hero-preload"[^>]*>/, "")
    .replace(/<style id="codexsun-public-home-style">[\s\S]*?<\/style>/, "")
    .replace(/<body[^>]*>[\s\S]*?<\/body>/, '<body><div id="root"></div></body>');
}
