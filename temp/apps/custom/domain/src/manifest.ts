import type { ModuleLayer } from './models/module-layer'
import type { PackageItem } from './models/package-item'
import type { RootFolder } from './models/root-folder'
import type { WorkbenchRoute } from './models/workbench-route'

export interface CustomAppArchitecture {
  title: string
  summary: string
  roots: RootFolder[]
  serverFolders: RootFolder[]
  frontendFolders: RootFolder[]
  moduleLayers: ModuleLayer[]
  packagesNeeded: PackageItem[]
  routes: WorkbenchRoute[]
}

export const customWorkbenchRoutes: WorkbenchRoute[] = [
  {
    path: '/',
    label: 'Overview',
    summary: 'Root app shape, server health, and the main boundaries.',
  },
  {
    path: '/structure',
    label: 'Structure',
    summary: 'Server, frontend, module, and model folder layout.',
  },
  {
    path: '/packages',
    label: 'Packages',
    summary: 'Only the packages required to run this scaffold.',
  },
]

export const customAppArchitecture: CustomAppArchitecture = {
  title: 'Custom App Scaffold',
  summary: 'Standalone app boundary with separate domain, server, and frontend roots.',
  roots: [
    {
      label: 'API',
      path: 'apps/custom/api',
      purpose: 'Own the backend entry point, module HTTP handlers, and app-local server config.',
    },
    {
      label: 'Domain',
      path: 'apps/custom/domain',
      purpose: 'Own app contracts, model types, root shape, and package decisions.',
    },
    {
      label: 'Web',
      path: 'apps/custom/web',
      purpose: 'Own the standalone frontend shell, layouts, and page modules.',
    },
  ],
  serverFolders: [
    {
      label: 'App',
      path: 'apps/custom/api/src/app',
      purpose: 'Server assembly, route dispatch, and app bootstrap.',
    },
    {
      label: 'Config',
      path: 'apps/custom/api/src/config',
      purpose: 'App-local environment and server defaults.',
    },
    {
      label: 'Modules',
      path: 'apps/custom/api/src/modules/<module>',
      purpose: 'Backend modules split into model, application, and http.',
    },
    {
      label: 'Shared',
      path: 'apps/custom/api/src/shared',
      purpose: 'Small HTTP helpers shared by backend modules.',
    },
  ],
  frontendFolders: [
    {
      label: 'App',
      path: 'apps/custom/web/src/app',
      purpose: 'Shell, layout, and top-level route composition.',
    },
    {
      label: 'Modules',
      path: 'apps/custom/web/src/modules/<module>',
      purpose: 'Frontend modules split into model, components, hooks, and pages.',
    },
    {
      label: 'Shared',
      path: 'apps/custom/web/src/shared',
      purpose: 'Small app-local UI helpers that are not yet global UI primitives.',
    },
    {
      label: 'Lib',
      path: 'apps/custom/web/src/lib',
      purpose: 'Frontend utilities such as API clients.',
    },
  ],
  moduleLayers: [
    {
      label: 'Backend module',
      folders: ['model', 'application', 'http'],
      purpose: 'Use case and transport split for server-owned modules.',
    },
    {
      label: 'Frontend module',
      folders: ['model', 'components', 'hooks', 'pages'],
      purpose: 'Page-owned module split without mixing shared app code into feature folders.',
    },
    {
      label: 'Domain model',
      folders: ['models'],
      purpose: 'Stable contract and structure types shared across the custom app.',
    },
  ],
  packagesNeeded: [
    {
      name: 'react',
      kind: 'runtime',
      reason: 'Frontend rendering.',
    },
    {
      name: 'react-dom',
      kind: 'runtime',
      reason: 'Frontend DOM mounting.',
    },
    {
      name: 'react-router-dom',
      kind: 'runtime',
      reason: 'Frontend route composition.',
    },
    {
      name: 'clsx',
      kind: 'runtime',
      reason: 'Class name composition used by shared UI.',
    },
    {
      name: 'tailwind-merge',
      kind: 'runtime',
      reason: 'Tailwind class deduplication for UI helpers.',
    },
    {
      name: 'vite',
      kind: 'dev',
      reason: 'Frontend dev server and bundling.',
    },
    {
      name: 'typescript',
      kind: 'dev',
      reason: 'Type-safe server and frontend scaffolding.',
    },
    {
      name: 'tsx',
      kind: 'dev',
      reason: 'Run the custom API in development.',
    },
    {
      name: 'tsup',
      kind: 'dev',
      reason: 'Bundle the custom API for build verification.',
    },
    {
      name: '@vitejs/plugin-react',
      kind: 'dev',
      reason: 'React support in Vite.',
    },
    {
      name: '@rolldown/plugin-babel',
      kind: 'dev',
      reason: 'Match the existing React compiler setup.',
    },
    {
      name: '@tailwindcss/vite',
      kind: 'dev',
      reason: 'Tailwind 4 integration for the custom frontend.',
    },
    {
      name: 'concurrently',
      kind: 'dev',
      reason: 'Run the custom server and frontend together.',
    },
  ],
  routes: customWorkbenchRoutes,
}
