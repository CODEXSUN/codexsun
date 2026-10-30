import Markdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/utils";
import { isValidElement } from "react";
import { MermaidPreview } from "../blocks/mermaid-preview";

function withoutMarkdownNode<T extends { node?: unknown }>(properties: T): Omit<T, "node"> {
  const { node, ...elementProperties } = properties;
  void node;
  return elementProperties;
}

export function MarkdownContent({ className, content }: { className?: string; content: string }) {
  return (
    <div
      className={cn("min-w-0 space-y-4 break-words text-sm leading-6 text-foreground", className)}
      data-slot="markdown-content"
    >
      <Markdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </Markdown>
    </div>
  );
}

const components: Components = {
  a: ({ children, ...properties }) => (
    <a
      className="font-medium text-primary underline underline-offset-4"
      rel="noreferrer"
      target="_blank"
      {...withoutMarkdownNode(properties)}
    >
      {children}
    </a>
  ),
  blockquote: ({ children, ...properties }) => (
    <blockquote className="border-l-2 pl-4 text-muted-foreground" {...withoutMarkdownNode(properties)}>
      {children}
    </blockquote>
  ),
  code: ({ children, ...properties }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]" {...withoutMarkdownNode(properties)}>
      {children}
    </code>
  ),
  h1: ({ children, ...properties }) => (
    <h1 className="pt-1 text-xl font-semibold tracking-tight" {...withoutMarkdownNode(properties)}>
      {children}
    </h1>
  ),
  h2: ({ children, ...properties }) => (
    <h2 className="pt-1 text-lg font-semibold tracking-tight" {...withoutMarkdownNode(properties)}>
      {children}
    </h2>
  ),
  h3: ({ children, ...properties }) => (
    <h3 className="pt-1 font-semibold" {...withoutMarkdownNode(properties)}>
      {children}
    </h3>
  ),
  hr: (properties) => <hr className="border-border" {...withoutMarkdownNode(properties)} />,
  li: ({ children, ...properties }) => (
    <li className="pl-1 [&>ol]:mt-2 [&>ul]:mt-2" {...withoutMarkdownNode(properties)}>
      {children}
    </li>
  ),
  ol: ({ children, ...properties }) => (
    <ol className="list-decimal space-y-2 pl-6 marker:font-medium" {...withoutMarkdownNode(properties)}>
      {children}
    </ol>
  ),
  p: ({ children, ...properties }) => <p {...withoutMarkdownNode(properties)}>{children}</p>,
  pre: ({ children, ...properties }) => {
    if (
      isValidElement<{ className?: string; children?: unknown }>(children) &&
      children.props.className?.split(" ").includes("language-mermaid")
    ) {
      return <MermaidPreview interactive source={String(children.props.children ?? "")} />;
    }
    return (
      <pre
        className="overflow-x-auto rounded-lg bg-neutral-950 p-4 font-mono text-[13px] leading-5 text-neutral-100 [&_code]:bg-transparent [&_code]:p-0"
        {...withoutMarkdownNode(properties)}
      >
        {children}
      </pre>
    );
  },
  table: ({ children, ...properties }) => (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left" {...withoutMarkdownNode(properties)}>
        {children}
      </table>
    </div>
  ),
  td: ({ children, ...properties }) => (
    <td className="border-t px-3 py-2 align-top" {...withoutMarkdownNode(properties)}>
      {children}
    </td>
  ),
  th: ({ children, ...properties }) => (
    <th className="bg-muted px-3 py-2 font-medium" {...withoutMarkdownNode(properties)}>
      {children}
    </th>
  ),
  ul: ({ children, ...properties }) => (
    <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground" {...withoutMarkdownNode(properties)}>
      {children}
    </ul>
  ),
};
