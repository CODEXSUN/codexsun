export const ideasPages = [
  {
    id: 'plan',
    label: 'Development plan',
    path: 'apps/docs/web/src/modules/docs-library/ideas.workspace.tsx',
    title: 'Development plan',
  },
  {
    id: 'architecture',
    label: 'Architecture standards',
    path: 'apps/docs/web/src/modules/docs-library/ideas.architecture.tsx',
    title: 'Architecture standards',
  },
  {
    id: 'monorepo',
    label: 'Shared packages and apps',
    path: 'apps/docs/web/src/modules/docs-library/ideas.monorepo.tsx',
    title: 'Shared packages and application ownership',
  },
] as const

export type IdeasPageId = (typeof ideasPages)[number]['id']

export function getIdeasPage(page: IdeasPageId) {
  return ideasPages.find((candidate) => candidate.id === page) ?? ideasPages[0]
}
