import { Button } from '../../components/button'
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
} from '../../components/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../../components/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../components/hover-card'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../../components/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../components/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/tooltip'
import { GalleryCard } from './gallery-card'

export function GalleryOverlays() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <GalleryCard
        description="Modal confirmation, dialog, drawer, and sheet layers."
        name="Layered surfaces"
      >
        <div className="flex flex-wrap justify-center gap-2">
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>Dialog</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Shared dialog</DialogTitle>
                <DialogDescription>Rendered from the central UI package.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" />}>Alert</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Continue?</AlertDialogTitle>
                <AlertDialogDescription>
                  This is a live alert dialog preview.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Drawer>
            <DrawerTrigger render={<Button variant="outline" />}>Drawer</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Shared drawer</DrawerTitle>
                <DrawerDescription>Bottom-aligned responsive content.</DrawerDescription>
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>Sheet</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Shared sheet</SheetTitle>
                <SheetDescription>Side-aligned supporting content.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </div>
      </GalleryCard>
      <GalleryCard
        description="Anchored menus and contextual information."
        name="Anchored surfaces"
      >
        <TooltipProvider>
          <div className="flex flex-wrap justify-center gap-2">
            <Popover>
              <PopoverTrigger render={<Button variant="outline" />}>Popover</PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>Component details</PopoverTitle>
                  <PopoverDescription>Reusable anchored content.</PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>Menu</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Open source</DropdownMenuItem>
                <DropdownMenuItem>Copy import</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <HoverCard>
              <HoverCardTrigger render={<Button variant="outline" />}>Hover card</HoverCardTrigger>
              <HoverCardContent>Hover information from the UI package.</HoverCardContent>
            </HoverCard>
            <Tooltip>
              <TooltipTrigger render={<Button variant="outline" />}>Tooltip</TooltipTrigger>
              <TooltipContent>Keyboard-accessible hint</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </GalleryCard>
    </div>
  )
}
