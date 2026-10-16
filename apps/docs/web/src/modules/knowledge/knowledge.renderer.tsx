import {
  lazy,
  Suspense,
  type ComponentType,
  type ReactNode,
  useEffect,
  useRef,
  useState
} from "react";
import { MDXProvider } from "@mdx-js/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolink from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import type { KnowledgePage } from "./knowledge.types";
import "./knowledge.css";
const compiled = import.meta.glob<{ default: ComponentType }>(
  "@codexsun/docs-content/applications/**/*.{md,mdx}"
);
const sources = new Map(
  Object.entries(compiled).map(([key, loader]) => [key.slice(key.indexOf("applications/")), loader])
);
const loaded = new Map<string, ReturnType<typeof lazy>>();
function baseline(path: string) {
  const key = path;
  const loader = sources.get(key);
  if (!loader) return null;
  let component = loaded.get(key);
  if (!component) {
    component = lazy(loader);
    loaded.set(key, component);
  }
  return component;
}
export function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="docs-callout">
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  );
}
export function Workflow({ steps }: { steps: string[] }) {
  return (
    <ol className="docs-workflow">
      {steps.map((step, index) => (
        <li key={step}>
          <span>{index + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  );
}
export function KnowledgeRenderer({
  page,
  onSelect
}: {
  page: KnowledgePage;
  onSelect: (pageKey: string) => void;
}) {
  const content = useRef<HTMLElement>(null);
  const [headings, setHeadings] = useState<{ id: string; label: string }[]>([]);
  const Component = baseline(page.sourcePath);
  useEffect(() => {
    setHeadings([]);
    const node = content.current;
    if (!node) return;
    const update = () =>
      setHeadings(
        [...node.querySelectorAll("h2[id],h3[id]")].map((h) => ({
          id: h.id,
          label: h.textContent ?? ""
        }))
      );
    const observer = new MutationObserver(update);
    observer.observe(node, { childList: true, subtree: true });
    update();
    return () => observer.disconnect();
  }, [page.uuid, page.revision]);
  return (
    <div className="docs-reader">
      <article
        ref={content}
        className="docs-prose"
        onClick={(event) => {
          const anchor = (event.target as Element).closest("a");
          if (!anchor) return;
          const href = anchor.getAttribute("href");
          if (!href || href.startsWith("#") || /^(https?:|mailto:|tel:)/.test(href)) return;
          event.preventDefault();
          const resolved = new URL(href, `https://docs.local/${page.pageKey}`);
          onSelect(resolved.pathname.slice(1).replace(/\.mdx?$/, ""));
        }}
      >
        <MDXProvider components={{ Callout, Workflow }}>
          {page.origin === "repository" && Component ? (
            <Suspense fallback={<p role="status">Loading documentation view…</p>}>
              <Component />
            </Suspense>
          ) : (
            <Markdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSlug, [rehypeAutolink, { behavior: "wrap" }], rehypeHighlight]}
              skipHtml
            >
              {page.body}
            </Markdown>
          )}
        </MDXProvider>
      </article>
      <nav className="docs-toc" aria-label="On this page">
        <strong>On this page</strong>
        {headings.map((h) => (
          <a key={h.id} href={`#${h.id}`}>
            {h.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
