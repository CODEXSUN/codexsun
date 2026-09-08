export const projectsModuleManifest = {
  capabilities: [
    'project-switcher',
    'project-context',
    'project-properties',
    'project-rename',
    'project-archive',
    'repository-binding',
  ],
  dependencies: { 'zetro.projects.api': '^0.2.0', 'zetro.desk.web': '^0.5.0' },
  id: 'zetro.projects.web',
  lifecycle: {
    activate: 'Load projects and mount the project switcher.',
    deactivate: 'Unmount project controls and discard transient selection.',
    install: 'No browser business data is created.',
    uninstall: 'No API project records are removed.',
    upgrade: 'Add the project properties layer and project update actions.',
  },
  publicContracts: ['ProjectProvider', 'ProjectSwitcher', 'useProjects'],
  scope: 'zetro-web',
  version: '0.2.0',
} as const
