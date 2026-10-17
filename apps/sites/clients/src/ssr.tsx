import React from "react";
import { renderToString } from "react-dom/server";
import ClientSurface from "@sites-client-entry";
import type { SitePublication } from "@codexsun/sites-api/public-contract";
export function renderSite(publication: SitePublication, path: string, origin: string) {
  const globals = globalThis as unknown as {
    __CODEXSUN_SITES_PATHNAME__?: string | undefined;
    __CODEXSUN_SITES_PUBLICATION__?: SitePublication | undefined;
  };
  const previousPath = globals.__CODEXSUN_SITES_PATHNAME__;
  const previousPublication = globals.__CODEXSUN_SITES_PUBLICATION__;
  globals.__CODEXSUN_SITES_PATHNAME__ = new URL(path, origin).pathname;
  globals.__CODEXSUN_SITES_PUBLICATION__ = publication;
  try {
    return renderToString(<ClientSurface />);
  } finally {
    globals.__CODEXSUN_SITES_PATHNAME__ = previousPath;
    globals.__CODEXSUN_SITES_PUBLICATION__ = previousPublication;
  }
}
