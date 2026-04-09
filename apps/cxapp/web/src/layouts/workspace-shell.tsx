import type { ReactNode } from "react"

type WorkspaceShellProps = {
  children: ReactNode
  title: string
  eyebrow: string
  technicalName?: string
}

function WorkspaceShell({
  children,
  title,
  eyebrow,
  technicalName = "shell.workspace",
}: WorkspaceShellProps) {
  return (
    <section
      className="mx-auto flex w-full max-w-7xl flex-col px-6 py-8 lg:px-10"
      data-technical-name={technicalName}
    >
      <header
        className="flex items-center justify-between border-b border-border/60 pb-6"
        data-technical-name={`${technicalName}.header`}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">
            {title}
          </h1>
        </div>
      </header>
      <div
        className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.15fr_0.95fr] lg:items-start"
        data-technical-name={`${technicalName}.content`}
      >
        {children}
      </div>
    </section>
  )
}

export default WorkspaceShell
