import { memo } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const markdownComponents: Components = {
  a: ({ children, href }) => (
    <a
      className="font-medium text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-primary/35 pl-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => (
    <code className={`rounded bg-muted px-1 py-0.5 font-mono text-[0.92em] ${className ?? ''}`}>
      {children}
    </code>
  ),
  h1: ({ children }) => <h1 className="mb-3 mt-5 text-xl font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2.5 mt-5 text-lg font-semibold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-2 mt-4 text-sm font-semibold">{children}</h4>,
  hr: () => <hr className="my-5 border-border" />,
  input: ({ checked, disabled, type }) => (
    <input
      checked={checked}
      className="mr-2 align-middle accent-primary"
      disabled={disabled}
      readOnly
      type={type}
    />
  ),
  li: ({ children }) => <li className="pl-1 marker:text-muted-foreground">{children}</li>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-muted p-3 text-[13px] leading-5 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-[13px]">{children}</table>
    </div>
  ),
  td: ({ children }) => <td className="border-t px-3 py-2 align-top">{children}</td>,
  th: ({ children }) => <th className="bg-muted px-3 py-2 font-semibold">{children}</th>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
}

export const AgentChatMarkdown = memo(function AgentChatMarkdown({ content }: { content: string }) {
  return (
    <div className="min-w-0 [overflow-wrap:anywhere] text-sm leading-6 text-foreground">
      <Markdown components={markdownComponents} remarkPlugins={[remarkGfm]} skipHtml>
        {content}
      </Markdown>
    </div>
  )
})
