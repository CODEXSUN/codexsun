import { Search } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@codexsun/ui/components/alert-dialog'
import { Button } from '@codexsun/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@codexsun/ui/components/command'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@codexsun/ui/components/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@codexsun/ui/components/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@codexsun/ui/components/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@codexsun/ui/components/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@codexsun/ui/components/hover-card'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@codexsun/ui/components/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@codexsun/ui/components/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@codexsun/ui/components/tooltip'
import { SpecimenStage } from './component-specimen-stage'

type SpecimenProps = { compact: boolean; componentId: string }

export function OverlaysSpecimen({ componentId, compact }: SpecimenProps) {
  return <SpecimenStage compact={compact}>{renderSpecimen(componentId, compact)}</SpecimenStage>
}

function renderSpecimen(componentId: string, compact: boolean) {
  const button = <Button size={compact ? 'sm' : 'default'} variant="outline" />
  if (componentId === 'alert-dialog') {
    return (
      <AlertDialog>
        <AlertDialogTrigger render={button}>Delete workspace</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workspace?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  if (componentId === 'command') {
    return (
      <Command className="w-full max-w-lg border shadow-sm">
        <CommandInput placeholder="Search the UI library" />
        <CommandList>
          <CommandEmpty>No component found.</CommandEmpty>
          <CommandGroup heading="Components">
            {['Button', 'Table', 'Form'].map((item) => (
              <CommandItem key={item}>
                <Search />
                {item}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    )
  }
  if (componentId === 'context-menu') {
    return (
      <ContextMenu>
        <ContextMenuTrigger className="grid h-32 w-full max-w-md place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
          Right-click this area
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Open preview</ContextMenuItem>
          <ContextMenuItem>Copy source</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }
  if (componentId === 'dialog') {
    return (
      <Dialog>
        <DialogTrigger render={button}>Open dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Component settings</DialogTitle>
            <DialogDescription>Configure the selected live specimen.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }
  if (componentId === 'drawer') {
    return (
      <Drawer>
        <DrawerTrigger render={button}>Open drawer</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Component details</DrawerTitle>
            <DrawerDescription>Review the default variant and public import.</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    )
  }
  if (componentId === 'dropdown-menu') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={button}>Component actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Open preview</DropdownMenuItem>
          <DropdownMenuItem>Copy source</DropdownMenuItem>
          <DropdownMenuItem>Set as default</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  if (componentId === 'hover-card') {
    return (
      <HoverCard>
        <HoverCardTrigger render={button}>Hover for details</HoverCardTrigger>
        <HoverCardContent>
          <p className="font-medium">Shared component</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Package-owned source with application-ready defaults.
          </p>
        </HoverCardContent>
      </HoverCard>
    )
  }
  if (componentId === 'popover') {
    return (
      <Popover>
        <PopoverTrigger render={button}>Open popover</PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Variant settings</PopoverTitle>
            <PopoverDescription>Select a documented component variant.</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    )
  }
  if (componentId === 'sheet') {
    return (
      <Sheet>
        <SheetTrigger render={button}>Open sheet</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Component source</SheetTitle>
            <SheetDescription>Inspect usage without leaving the current page.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )
  }
  if (componentId === 'tooltip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={button}>Hover or focus</TooltipTrigger>
          <TooltipContent>Copy component import</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  return <p className="text-sm text-muted-foreground">Dedicated overlay preview</p>
}
