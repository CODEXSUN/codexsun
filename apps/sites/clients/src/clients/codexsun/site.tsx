import { ArticlePage } from "./articles/ArticlePage";
import { ArticlesPage } from "./articles/ArticlesPage";
import { HomePage } from "./HomePage";
import { WorkPage } from "./work/WorkPage";
import { useClientDocument } from "../../shared/useClientDocument";

function normalizePathname(pathname: string) {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

export function CodexsunSite() {
  const pathname = normalizePathname(window.location.pathname);
  const pageName =
    pathname === "/" ? "Home" : pathname.startsWith("/articles") ? "Insights" : "Work";

  useClientDocument(
    `CODEXSUN | ${pageName}`,
    "CODEXSUN builds modular business software, billing systems, websites and governed automation.",
    "#0a0a0a"
  );

  if (pathname === "/") return <HomePage />;
  if (pathname === "/articles") return <ArticlesPage />;
  if (pathname.startsWith("/articles/")) {
    return <ArticlePage slug={decodeURIComponent(pathname.slice("/articles/".length))} />;
  }
  if (pathname.startsWith("/work/")) {
    return <WorkPage id={decodeURIComponent(pathname.slice("/work/".length))} />;
  }

  return (
    <main className="codexsun-public-site public-not-found">
      <a href="/">&larr; CODEXSUN</a>
      <h1>Page not found.</h1>
    </main>
  );
}

export default CodexsunSite;
