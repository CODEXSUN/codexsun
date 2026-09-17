import { Boxes, Home, Settings } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@codexsun/ui/components/accordion'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@codexsun/ui/components/breadcrumb'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@codexsun/ui/components/menubar'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@codexsun/ui/components/navigation-menu'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@codexsun/ui/components/pagination'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@codexsun/ui/components/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@codexsun/ui/components/tabs'
import type { UiComponentVariantId } from './component-variants'
import { SpecimenStage } from './component-specimen-stage'

type SpecimenProps = {
  compact: boolean
  componentId: string
  variant: UiComponentVariantId
}

export function NavigationSpecimen({ componentId, compact, variant }: SpecimenProps) {
  if (componentId === 'accordion') return <AccordionSpecimen compact={compact} variant={variant} />

  return <SpecimenStage compact={compact}>{renderSpecimen(componentId, compact)}</SpecimenStage>
}

function renderSpecimen(componentId: string, compact: boolean) {
  if (componentId === 'breadcrumb') {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">UI</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/?component=accordion">Components</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }
  if (componentId === 'menubar') {
    return (
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New component</MenubarItem>
            <MenubarItem>Copy source</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Default variant</MenubarItem>
            <MenubarItem>Compact variant</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    )
  }
  if (componentId === 'navigation-menu') {
    return (
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">Overview</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Library</NavigationMenuTrigger>
            <NavigationMenuContent className="p-3">
              <div className="grid w-64 gap-2">
                <NavigationMenuLink href="/?component=button">Components</NavigationMenuLink>
                <NavigationMenuLink href="/?block=table">Blocks</NavigationMenuLink>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    )
  }
  if (componentId === 'pagination') {
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          {[1, 2, 3].slice(0, compact ? 2 : 3).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink href="#" isActive={page === 1}>
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }
  if (componentId === 'sidebar') {
    return (
      <div
        className={
          compact
            ? 'h-48 w-full max-w-md overflow-hidden rounded-lg border'
            : 'h-64 w-full max-w-xl overflow-hidden rounded-lg border'
        }
      >
        <SidebarProvider className="min-h-0" defaultOpen>
          <Sidebar collapsible="none" className="relative h-full w-56">
            <SidebarHeader className="font-semibold">CODEXSUN UI</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Library</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Home />
                        Overview
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Boxes />
                        Components
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Settings />
                        Settings
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </div>
    )
  }
  if (componentId === 'tabs') {
    return (
      <Tabs className="w-full max-w-xl" defaultValue="preview">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>
        <TabsContent className="rounded-lg border p-4 text-sm" value="preview">
          The selected variant renders here.
        </TabsContent>
        <TabsContent className="rounded-lg border p-4 text-sm" value="code">
          Copy the public package import.
        </TabsContent>
        <TabsContent className="rounded-lg border p-4 text-sm" value="usage">
          Use the default inside blocks.
        </TabsContent>
      </Tabs>
    )
  }
  return <p className="text-sm text-muted-foreground">Dedicated navigation preview</p>
}

const accordionItems = [
  {
    title: 'Can I change or cancel my order after placing it?',
    content:
      'Yes, you can change or cancel your order within 1 hour of placement by visiting your account page or contacting our support team. After that, orders may already be processed for shipping.',
  },
  {
    title: 'How long does shipping usually take?',
    content:
      'Domestic shipping typically takes 3-5 business days, while international orders may take up to 2-3 weeks depending on your location and customs processing times.',
  },
  {
    title: 'What is your return policy?',
    content:
      'We offer a 30-day return policy for most products. Items must be unused and in their original packaging. To initiate a return, simply contact our support with your order details.',
  },
]

function AccordionSpecimen({
  compact,
  variant,
}: {
  compact: boolean
  variant: UiComponentVariantId
}) {
  const boxed = variant === 'boxed'

  return (
    <div
      className={
        compact
          ? 'mx-auto flex min-h-44 w-full items-center justify-center px-4 py-5'
          : 'mx-auto flex min-h-64 w-full items-center justify-center px-4 py-8'
      }
    >
      <Accordion className="w-full max-w-lg" multiple={false}>
        {accordionItems.map(({ title, content }, index) => (
          <AccordionItem
            className={
              boxed
                ? 'border px-4 not-last:border-b-0 first:rounded-t-md last:rounded-b-md last:border-b'
                : undefined
            }
            key={title}
            value={`item-${index}`}
          >
            <AccordionTrigger>{title}</AccordionTrigger>
            <AccordionContent>{content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
