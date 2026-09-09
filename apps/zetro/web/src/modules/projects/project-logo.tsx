import type { CSSProperties } from 'react'
import type { ZetroProject } from './projects.types'

export function ProjectLogo({
  className = 'size-8',
  project,
}: {
  className?: string
  project: Pick<ZetroProject, 'logoColor' | 'logoText' | 'name'>
}) {
  const style: CSSProperties = {
    backgroundColor: project.logoColor,
    color: foregroundFor(project.logoColor),
  }

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-lg text-xs font-semibold ${className}`}
      style={style}
      title={project.name}
    >
      {project.logoText}
    </span>
  )
}

function foregroundFor(color: string) {
  const red = Number.parseInt(color.slice(1, 3), 16)
  const green = Number.parseInt(color.slice(3, 5), 16)
  const blue = Number.parseInt(color.slice(5, 7), 16)
  return red * 0.299 + green * 0.587 + blue * 0.114 > 165 ? '#18181b' : '#ffffff'
}
