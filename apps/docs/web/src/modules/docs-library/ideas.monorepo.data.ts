import {
  BlocksIcon,
  BookOpenIcon,
  BoxesIcon,
  Code2Icon,
  LayoutPanelTopIcon,
  MonitorIcon,
  PaletteIcon,
  ServerCogIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from 'lucide-react'

export const monorepoApplications = [
  {
    color: 'text-sky-600 dark:text-sky-400',
    icon: MonitorIcon,
    title: 'Platform',
  },
  {
    color: 'text-pink-600 dark:text-pink-400',
    icon: LayoutPanelTopIcon,
    title: 'UIUX',
  },
  {
    color: 'text-blue-600 dark:text-blue-400',
    icon: BookOpenIcon,
    title: 'Docs',
  },
  {
    color: 'text-violet-600 dark:text-violet-400',
    icon: WrenchIcon,
    title: 'DevKit',
  },
  {
    color: 'text-indigo-600 dark:text-indigo-400',
    icon: BoxesIcon,
    title: 'Zetro',
  },
  {
    color: 'text-emerald-600 dark:text-emerald-400',
    icon: ShieldCheckIcon,
    title: 'Orship',
  },
] as const

export const monorepoSharedPackages = [
  {
    color: 'text-amber-600 dark:text-amber-400',
    icon: BlocksIcon,
    title: 'Framework',
  },
  {
    color: 'text-cyan-600 dark:text-cyan-400',
    icon: Code2Icon,
    title: 'Platform Core',
  },
  {
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    icon: PaletteIcon,
    title: 'UI',
  },
  {
    color: 'text-orange-600 dark:text-orange-400',
    icon: ServerCogIcon,
    title: 'Runtime',
  },
] as const

export const monorepoPractices = [
  [
    'One install',
    'Install dependencies at the repository root. Keep one lockfile and one node_modules folder.',
  ],
  [
    'Clear workspace edges',
    'Applications do not import each other’s private source. Shared packages expose public contracts.',
  ],
  [
    'Independent ownership',
    'Each application keeps its routes, modules, migrations, and operational records.',
  ],
  [
    'Selected assembly',
    'The runtime catalog selects the applications and packages for a local or customer deployment.',
  ],
] as const
