import {
  MasterListDesk,
  type MasterListDeskColumn,
  type MasterListDeskFilter,
  type MasterListDeskRecord,
} from '@codexsun/ui/blocks/master-list';
import { useMdiTopology } from '@codexsun/ui/layouts/mdi-main';
import { getStatusBadgeValue, StatusBadge } from '@codexsun/ui/components/status-badge';
import { UiTemplatePage } from '@codexsun/ui/templates/ui-page';

type EnquiryRecord = MasterListDeskRecord & {
  assignedTo: string;
  customer: string;
  date: string;
  details: string;
  listIn: string;
  mobile: string;
  status: string;
  user: string;
};

const filters: MasterListDeskFilter[] = [
  { id: 'id', label: 'ID', operator: true },
  { id: 'mobile', label: 'Mobile', operator: true },
  { id: 'customer', label: 'Customer' },
  { id: 'details', label: 'Enquiry Details', operator: true },
  { id: 'listIn', label: 'List in' },
  { id: 'user', label: 'User' },
  { id: 'date', label: 'Date' },
  { id: 'assignedTo', label: 'Assigned To' },
  { id: 'status', label: 'Status' },
];

const columns: MasterListDeskColumn<EnquiryRecord>[] = [
  { id: 'details', label: 'Enquiry Details', width: 'minmax(280px, 2fr)', render: (record) => record.details },
  { id: 'customer', label: 'Customer', width: 'minmax(190px, 1.3fr)', render: (record) => record.customer },
  { id: 'listIn', label: 'List in', width: 'minmax(110px, .7fr)', render: (record) => record.listIn },
  { id: 'user', label: 'User', width: 'minmax(150px, 1fr)', render: (record) => record.user },
  { id: 'date', label: 'Date', width: 'minmax(120px, .8fr)', render: (record) => record.date },
  { id: 'assignedTo', label: 'Assigned To', width: 'minmax(150px, 1fr)', render: (record) => record.assignedTo },
  {
    id: 'status',
    label: 'Status',
    width: 'minmax(120px, .8fr)',
    render: (record) => <StatusBadge label={record.status} status={getStatusBadgeValue(record.status)} />,
  },
];

const records: EnquiryRecord[] = [
  {
    id: 'ENQ785',
    details: 'LAPTOP ENQ BASIC',
    customer: 'Northstar Industries',
    listIn: 'MBO',
    user: 'Deepak Kannan',
    date: '06-08-2026',
    assignedTo: 'Deepak Kannan',
    status: 'Won',
    mobile: '98765 10101',
    age: '2 w',
  },
  {
    id: 'ENQ793',
    details: 'Office printer requirement',
    customer: 'Fine Networking LLP',
    listIn: 'Stores',
    user: 'Vijay Anand',
    date: '06-08-2026',
    assignedTo: 'Vijay Anand',
    status: 'Long Hold',
    mobile: '98765 20202',
    age: '3 w',
  },
  {
    id: 'ENQ1286',
    details: 'Desktop systems for design team',
    customer: 'Humus Impex Private Limited',
    listIn: 'Stores',
    user: 'Mahendran',
    date: '11-09-2026',
    assignedTo: 'Mahendran',
    status: 'Long Hold',
    mobile: '98765 30303',
    age: '4 d',
  },
  {
    id: 'ENQ711',
    details: 'REFURB DESKTOP ENQ',
    customer: 'Arun Textiles',
    listIn: 'MBO',
    user: 'Deepak Kannan',
    date: '24-07-2026',
    assignedTo: 'Deepak Kannan',
    status: 'Lost',
    mobile: '98765 40404',
    age: '2 w',
  },
  {
    id: 'ENQ710',
    details: 'DESKTOP ENQ',
    customer: 'The Factory Outlet',
    listIn: 'MBO',
    user: 'Deepak Kannan',
    date: '24-07-2026',
    assignedTo: 'Deepak Kannan',
    status: 'Won',
    mobile: '98765 50505',
    age: '1 M',
  },
  {
    id: 'ENQ1006',
    details: 'Graphic workstation and monitor',
    customer: 'Bala Engineering',
    listIn: 'MBO',
    user: 'Mahendran',
    date: '27-08-2026',
    assignedTo: 'Mahendran',
    status: 'Open',
    mobile: '98765 60606',
    age: '3 w',
  },
  {
    id: 'ENQ660',
    details: 'Biometric device requirement',
    customer: 'The Great Minds',
    listIn: 'Stores',
    user: 'Karthik D',
    date: '16-07-2026',
    assignedTo: 'Karthik D',
    status: 'Open',
    mobile: '98765 70707',
    age: '1 M',
  },
  {
    id: 'ENQ898',
    details: 'Current-year invoice and discount',
    customer: 'Make Wonder Clothing',
    listIn: 'Admin',
    user: 'Karthik D',
    date: '18-08-2026',
    assignedTo: 'Karthik D',
    status: 'Hold for Approval',
    mobile: '98765 80808',
    age: '2 w',
  },
  {
    id: 'ENQ819',
    details: 'Storage quote follow-up',
    customer: 'Make Wonder Clothing',
    listIn: 'Service',
    user: 'Ratheesh P',
    date: '11-08-2026',
    assignedTo: 'Ratheesh P',
    status: 'Open',
    mobile: '98765 90909',
    age: '1 M',
  },
  {
    id: 'ENQ1011',
    details: 'Phone delivery confirmation',
    customer: 'Sree Kumaran Tapes',
    listIn: 'MBO',
    user: 'Vijay Anand',
    date: '27-08-2026',
    assignedTo: 'Vijay Anand',
    status: 'Won',
    mobile: '98765 01010',
    age: '2 w',
  },
];

const exampleCode = `import { MasterListDesk } from '@codexsun/ui/blocks/master-list'

<MasterListDesk
  columns={columns}
  filters={filters}
  records={enquiries}
  title="Enquiry"
  primaryActionLabel="Add Enquiry"
  getFilterValue={(record, filterId) => String(record[filterId] ?? '')}
/>`;

function getEnquiryFilterValue(record: EnquiryRecord, filterId: string) {
  return String(record[filterId as keyof EnquiryRecord] ?? '');
}

export function MasterListDeskPage({ pageVariant = 'v2' }: { pageVariant?: 'v2' | 'v3' }) {
  const topology = useMdiTopology();

  return (
    <UiTemplatePage
      code={exampleCode}
      importPath="@codexsun/ui/blocks/master-list"
      kind="Template"
      name={`Master List ${pageVariant}`}
      preview={
        <div className="relative min-h-[620px]">
          <MasterListDesk
            columns={columns}
            filterPlacement={pageVariant === 'v3' ? 'columns' : 'top'}
            filters={filters}
            getFilterValue={getEnquiryFilterValue}
            primaryActionLabel="Add Enquiry"
            records={records}
            sortLabel="Customer"
            title="Enquiry"
            totalLabel="1,000+"
          />
        </div>
      }
      previewClassName="w-[96%]"
      topology={topology}
      topologyIds={{ page: '27', preview: '27.1', usage: '27.2' }}
      usageDescription={
        <p>
          Use this dense page for high-volume operational records. The application supplies field filters, columns,
          records, actions, permissions, and persistence.
        </p>
      }
    />
  );
}

export function UiMasterListV2() {
  return <MasterListDeskPage pageVariant="v2" />;
}
