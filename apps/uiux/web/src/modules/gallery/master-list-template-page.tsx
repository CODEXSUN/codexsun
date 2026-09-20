import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  MasterForm,
  MasterList,
  type MasterField,
  type MasterFormValues,
  type MasterRecord,
} from '@codexsun/ui/blocks/master-list';
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main';
import { getStatusBadgeValue, StatusBadge } from '@codexsun/ui/components/status-badge';
import { TopologyRegion } from '@codexsun/ui/features/interface-topology';
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page';

export type MasterListPageVariant = 'v1' | 'v2' | 'v3' | 'v4';

const variantConfig = {
  v1: { form: 'panel', initialMode: 'list', list: 'table', name: 'Master List v1' },
  v2: { form: 'panel', initialMode: 'list', list: 'cards', name: 'Master List v2' },
  v3: { form: 'panel', initialMode: 'list', list: 'table', name: 'Master List v3' },
  v4: { form: 'panel', initialMode: 'list', list: 'table', name: 'Master List v4' },
} as const;

const fields: MasterField[] = [
  { id: 'code', label: 'Code', required: true, placeholder: 'e.g. CAT-001' },
  { id: 'name', label: 'Name', required: true, placeholder: 'Category name' },
  {
    id: 'group',
    label: 'Group',
    type: 'select',
    required: true,
    options: [
      { label: 'Retail', value: 'Retail' },
      { label: 'Services', value: 'Services' },
      { label: 'Operations', value: 'Operations' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options: [
      { label: 'Active', value: 'Active' },
      { label: 'Draft', value: 'Draft' },
    ],
    format: (value) => {
      const label = String(value ?? '');
      return <StatusBadge label={label} status={getStatusBadgeValue(label)} />;
    },
  },
  { id: 'description', label: 'Description', type: 'textarea', showInList: false, placeholder: 'Optional notes' },
];

const initialRecords: MasterRecord[] = [
  {
    id: 'category-1',
    code: 'CAT-001',
    name: 'Retail products',
    group: 'Retail',
    status: 'Active',
    description: 'Products sold through stores.',
  },
  {
    id: 'category-2',
    code: 'CAT-002',
    name: 'Consulting',
    group: 'Services',
    status: 'Active',
    description: 'Professional services.',
  },
  {
    id: 'category-3',
    code: 'CAT-003',
    name: 'Internal supplies',
    group: 'Operations',
    status: 'Draft',
    description: '',
  },
];

const exampleCode = `import { MasterForm, MasterList } from '@codexsun/ui/blocks/master-list'

<MasterList fields={fields} records={records} title="Categories"
  variant="table" onCreate={openCreate} onEdit={openEdit} />

<MasterForm fields={fields} values={draft} title="New category"
  onValueChange={updateDraft} onSubmit={saveRecord} onCancel={closeForm} />`;

export function MasterListTemplatePage({ pageVariant }: { pageVariant: MasterListPageVariant }) {
  const config = variantConfig[pageVariant];
  const topology = useMdiTopology();
  const [records, setRecords] = useState(initialRecords);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>(config.initialMode);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MasterFormValues>(() => formValues());
  const [, setMessage] = useState(`${config.name} is ready.`);

  function openCreate() {
    setDraft(formValues());
    setSelectedId(null);
    setMode('create');
  }

  function openEdit(record: MasterRecord) {
    setDraft(formValues(record));
    setSelectedId(record.id);
    setMode('edit');
  }

  function saveRecord(values: MasterFormValues) {
    if (mode === 'edit' && selectedId) {
      setRecords((current) => current.map((record) => (record.id === selectedId ? { ...record, ...values } : record)));
      setMessage(`${values.name} updated in this preview.`);
    } else {
      setRecords((current) => [...current, { id: crypto.randomUUID(), ...values }]);
      setMessage(`${values.name} added to this preview.`);
    }
    setMode('list');
  }

  return (
    <UiTemplatePage
      code={exampleCode}
      importPath="@codexsun/ui/blocks/master-list"
      kind="Template"
      name={config.name}
      preview={
        <div className={pageVariant === 'v4' ? 'min-h-96 px-0 pb-6' : 'min-h-96 p-6'}>
          {mode === 'list' ? (
            <div className="[&_tbody_tr:hover]:bg-muted/70">
              {pageVariant === 'v4' ? (
                <TopologyRegion
                  as="header"
                  className="flex h-12 items-center justify-between gap-3 border-b border-border px-4 py-2"
                  id="27.1.1"
                  topology={topology}
                >
                  <TopologyRegion as="span" className="min-w-0" id="27.1.1.1" topology={topology}>
                    <h2 className="text-base font-semibold">Categories</h2>
                  </TopologyRegion>
                  <TopologyRegion as="span" id="27.1.1.2" topology={topology}>
                    <button
                      className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
                      onClick={openCreate}
                      type="button"
                    >
                      <Plus aria-hidden="true" size={14} />
                      New category
                    </button>
                  </TopologyRegion>
                </TopologyRegion>
              ) : null}
              <div className={pageVariant === 'v4' ? 'mx-auto w-[90%] pt-4' : undefined}>
                <MasterList
                  createLabel="New category"
                  description="Create and manage category master records."
                  fields={fields}
                  onCreate={openCreate}
                  onEdit={openEdit}
                  onView={(record) => setMessage(`Viewing ${record.name}.`)}
                  records={records}
                  showHeader={pageVariant !== 'v4'}
                  title="Categories"
                  topology={topology}
                  topologyIds={{
                    columnFilter: '27.1.2.2',
                    content: '27.1.3',
                    header: '27.1.1',
                    pageNavigation: '27.1.4.2',
                    pageSize: '27.1.4.1',
                    pagination: '27.1.4',
                    rowHeader: '27.1.3.1',
                    rows: '27.1.3.2',
                    search: '27.1.2',
                    searchBar: '27.1.2.1',
                  }}
                  variant={config.list}
                />
              </div>
            </div>
          ) : (
            <MasterForm
              description={pageVariant === 'v3' ? 'Use the full page to create or edit one master record.' : undefined}
              fields={fields}
              onCancel={() => setMode('list')}
              onSubmit={saveRecord}
              onValueChange={(fieldId, value) => setDraft((current) => ({ ...current, [fieldId]: value }))}
              submitLabel={mode === 'create' ? 'Create category' : 'Save changes'}
              title={mode === 'create' ? 'New category' : 'Edit category'}
              values={draft}
              variant={config.form}
            />
          )}
        </div>
      }
      topology={topology}
      topologyIds={{ page: '27', preview: '27.1', usage: '27.2' }}
      usageDescription={
        <p>
          Each version is a separate UIUX page. All versions use the same package block, field definitions, record
          actions, and application-owned persistence contract.
        </p>
      }
    />
  );
}

function formValues(record?: MasterRecord): MasterFormValues {
  return Object.fromEntries(fields.map((field) => [field.id, String(record?.[field.id] ?? '')]));
}
