import Markdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from 'cn'

export function MarkdownContent({ className, content }: { className?: string; content: string }) {
  return (
    <div
      className={cn('min-w-0 space-y-4 break-words text-sm leading-6 text-foreground', className)}
      data-slot="markdown-content"
    >
      <Markdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </Markdown>
    </div>
  )
}

const components: Components = {
  a: ({ children, node: _node, ...props }) => (
    <a
      className="font-medium text-primary underline underline-offset-4"
      rel="noreferrer"
      target="_blank"
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ children, node: _node, ...props }) => (
    <blockquote className="border-l-2 pl-4 text-muted-foreground" {...props}>
      {children}
    </blockquote>
  ),
  code: ({ children, node: _node, ...props }) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]" {...props}>
      {children}
    </code>
  ),
  h1: ({ children, node: _node, ...props }) => (
    <h1 className="pt-1 text-xl font-semibold tracking-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, node: _node, ...props }) => (
    <h2 className="pt-1 text-lg font-semibold tracking-tight" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, node: _node, ...props }) => (
    <h3 className="pt-1 font-semibold" {...props}>
      {children}
    </h3>
  ),
  hr: ({ node: _node, ...props }) => <hr className="border-border" {...props} />,
  li: ({ children, node: _node, ...props }) => (
    <li className="pl-1 [&>ol]:mt-2 [&>ul]:mt-2" {...props}>
      {children}
    </li>
  ),
  ol: ({ children, node: _node, ...props }) => (
    <ol className="list-decimal space-y-2 pl-6 marker:font-medium" {...props}>
      {children}
    </ol>
  ),
  p: ({ children, node: _node, ...props }) => <p {...props}>{children}</p>,
  pre: ({ children, node: _node, ...props }) => (
    <pre
      className="overflow-x-auto rounded-lg bg-neutral-950 p-4 font-mono text-[13px] leading-5 text-neutral-100 [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, node: _node, ...props }) => (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left" {...props}>
        {children}
      </table>
    </div>
  ),
  td: ({ children, node: _node, ...props }) => (
    <td className="border-t px-3 py-2 align-top" {...props}>
      {children}
    </td>
  ),
  th: ({ children, node: _node, ...props }) => (
    <th className="bg-muted px-3 py-2 font-medium" {...props}>
      {children}
    </th>
  ),
  ul: ({ children, node: _node, ...props }) => (
    <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground" {...props}>
      {children}
    </ul>
  ),
}
