import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main';
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page';
import { createUiPageCode } from './ui-page-code';
import { UiPagePreview } from './ui-page-preview';
import { uiPageDocs, type UiPageDoc } from './ui-pages';

export function UiPageDocumentation({ page }: { page: UiPageDoc }) {
  const topology = useMdiTopology();
  const index = uiPageDocs.findIndex(({ id }) => id === page.id);
  const previous = uiPageDocs[index - 1];
  const next = uiPageDocs[index + 1];

  return (
    <UiTemplatePage
      code={createUiPageCode(page)}
      importPath={page.family.source}
      kind="Page"
      name={page.name}
      navigation={{
        previous: previous
          ? { href: `/?page=${previous.id}`, name: previous.name }
          : { href: '/?layout=agent-workspace', name: 'Agent Workspace' },
        next: next ? { href: `/?page=${next.id}`, name: next.name } : { href: '/?block=table', name: 'Table' },
      }}
      preview={<UiPagePreview page={page} />}
      showCode={false}
      topology={topology}
      topologyIds={{ page: '25', preview: '25.1', usage: '25.2' }}
      usageDescription={
        <p>
          Connect the public page block to the owning application route, authentication service, or notification state.
          The selected default is resolved programmatically for this page family.
        </p>
      }
      usageTitle={`${page.name} usage`}
    />
  );
}
