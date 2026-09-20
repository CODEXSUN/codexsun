import { MainWorkspace } from '@codexsun/ui';
import {
  BellIcon,
  BlocksIcon,
  BotIcon,
  BookOpenIcon,
  BoxIcon,
  Columns3Icon,
  ComponentIcon,
  CreditCardIcon,
  FilePenLineIcon,
  FilterIcon,
  FingerprintIcon,
  FolderTreeIcon,
  HeartIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  MessageSquareIcon,
  NewspaperIcon,
  PanelsTopLeftIcon,
  PanelTopIcon,
  ScaleIcon,
  ShoppingBagIcon,
  StoreIcon,
  Table2Icon,
  TagIcon,
  TicketIcon,
  TrendingDownIcon,
  TruckIcon,
  UploadCloudIcon,
} from 'lucide-react';
import {
  uiBlockDocs,
  uiComponentDocs,
  uiGalleryTopologySections,
  uiLayoutDocs,
  uiPageDocs,
  uiStaticPageDocs,
  uiTemplateDocs,
  UiGalleryContainer,
} from './modules/gallery';

const layoutIcons = {
  'agent-workspace': BotIcon,
  'documentation-workspace': BookOpenIcon,
  mdi: PanelsTopLeftIcon,
  'main-workspace': PanelsTopLeftIcon,
} as const;
const staticPageIcons = {
  'site-header': PanelTopIcon,
  'ecommerce-header': StoreIcon,
  'blog-header': NewspaperIcon,
} as const;
const blockIcons = {
  form: FilePenLineIcon,
  table: Table2Icon,
  'execution-status': BotIcon,
  kanban: Columns3Icon,
  'file-tree': FolderTreeIcon,
  dropzone: UploadCloudIcon,
  'filter-builder': FilterIcon,
  'product-card': ShoppingBagIcon,
  pricing: TagIcon,
  cart: ShoppingBagIcon,
  categories: LayersIcon,
  checkout: CreditCardIcon,
  comparison: ScaleIcon,
  'coupon-wallet': TicketIcon,
  'delivery-tracker': TruckIcon,
  'payment-methods': CreditCardIcon,
  'price-history': TrendingDownIcon,
  reviews: MessageSquareIcon,
  wishlist: HeartIcon,
  footer: PanelTopIcon,
  blog: BookOpenIcon,
} as const;

export function App() {
  const search = new URLSearchParams(window.location.search);
  const selectedLayout = search.get('layout');
  const selectedPage = search.get('page');
  const selectedStaticPage = search.get('static');
  const selectedComponent = search.get('component');
  const selectedBlock = search.get('block') ?? (selectedComponent === 'table' ? 'table' : null);
  const selectedTemplate = search.get('template');
  const selectedTemplateVariant = search.get('variant') ?? 'v1';

  const navigation = [
    {
      icon: LayoutTemplateIcon,
      label: 'Layouts',
      items: uiLayoutDocs.map((layout) => ({
        active: selectedLayout === layout.id,
        href: `/?layout=${layout.id}`,
        icon: layoutIcons[layout.id],
        label: layout.name,
      })),
    },
    {
      icon: PanelsTopLeftIcon,
      label: 'Static Pages',
      items: uiStaticPageDocs.map((page) => ({
        active: selectedStaticPage === page.id,
        href: `/?static=${page.id}`,
        icon: staticPageIcons[page.id],
        label: page.name,
      })),
    },
    {
      items: [
        {
          active: selectedPage !== null && selectedPage !== 'notifications',
          children: uiPageDocs
            .filter(({ id }) => id !== 'notifications')
            .map((page) => ({
              active: selectedPage === page.id,
              href: `/?page=${page.id}`,
              label: page.name,
            })),
          defaultOpen: selectedPage !== null && selectedPage !== 'notifications',
          icon: FingerprintIcon,
          label: 'Authentication',
        },
        {
          active: selectedPage === 'notifications',
          href: '/?page=notifications',
          icon: BellIcon,
          label: 'Notifications Page',
        },
      ],
    },
    {
      icon: BlocksIcon,
      label: 'Blocks',
      items: uiBlockDocs.map((block) => ({
        active: selectedBlock === block.id,
        href: `/?block=${block.id}`,
        icon: blockIcons[block.id],
        label: block.name,
      })),
    },
    {
      icon: LayoutTemplateIcon,
      label: 'Templates',
      items: uiTemplateDocs.map((template) => ({
        active: selectedTemplate === template.id,
        children: template.variants.map((variant) => ({
          active: selectedTemplate === template.id && selectedTemplateVariant === variant.id,
          href: `/?template=${template.id}&variant=${variant.id}`,
          label: variant.name,
        })),
        defaultOpen: selectedTemplate === template.id,
        icon: Table2Icon,
        label: template.name,
      })),
    },
    {
      icon: ComponentIcon,
      label: 'Components',
      items: uiComponentDocs.map((component) => ({
        active: selectedComponent === component.id,
        href: `/?component=${component.id}`,
        icon: BoxIcon,
        label: component.name,
      })),
    },
  ];

  return (
    <MainWorkspace
      applicationId="uiux"
      applicationName="UIUX"
      navigation={navigation}
      primaryAction={{
        icon: LayoutDashboardIcon,
        label: 'Overview',
        onSelect: () => window.location.assign('/'),
      }}
      searchPlaceholder="Search UIUX"
      showAppearancePanel={false}
      showTopologyTools={true}
      sidebarStateKey="codexsun.uiux.sidebar"
      topologySections={uiGalleryTopologySections}
      workspaceTitle="Overview"
    >
      <UiGalleryContainer />
    </MainWorkspace>
  );
}
