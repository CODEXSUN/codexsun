import * as React from "react"

import { cn } from "@/lib/utils"

type SidebarContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  isMobile: boolean
  state: "expanded" | "collapsed"
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)

  if (!context) {
    throw new Error("Sidebar components must be used within SidebarProvider.")
  }

  return context
}

function SidebarProvider({ children }: React.PropsWithChildren) {
  const [open, setOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)")
    const sync = () => {
      setIsMobile(mediaQuery.matches)
      if (mediaQuery.matches) {
        setOpen(false)
      }
    }

    sync()
    mediaQuery.addEventListener("change", sync)

    return () => {
      mediaQuery.removeEventListener("change", sync)
    }
  }, [])

  return (
    <SidebarContext.Provider
      value={{
        open,
        setOpen,
        isMobile,
        state: open ? "expanded" : "collapsed",
      }}
    >
      <div className="flex min-h-screen w-full bg-transparent">{children}</div>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  children,
  className,
}: React.PropsWithChildren<
  React.ComponentProps<"aside"> & {
    collapsible?: "icon"
    inset?: boolean
    variant?: "inset" | "sidebar"
  }
>) {
  const { open, isMobile } = useSidebar()

  return (
    <aside
      data-slot="sidebar"
      data-state={open ? "open" : "closed"}
      className={cn(
        "fixed inset-y-0 left-0 z-40 overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        open ? "w-72" : "w-0 overflow-hidden md:w-16",
        isMobile && !open ? "hidden" : "block",
        className
      )}
    >
      <div className="flex h-full min-h-0 flex-col">{children}</div>
    </aside>
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  const { open, isMobile } = useSidebar()

  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "min-h-screen min-w-0 flex-1 bg-background transition-[margin] duration-200",
        !isMobile ? (open ? "md:ml-72" : "md:ml-16") : "",
        className
      )}
      {...props}
    />
  )
}

function SidebarTrigger({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { open, setOpen } = useSidebar()

  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      data-state={open ? "open" : "closed"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-sm hover:bg-muted",
        className
      )}
      onClick={() => {
        setOpen((value) => !value)
      }}
      {...props}
    >
      <span className="sr-only">Toggle sidebar</span>
      <span className="flex h-3.5 w-4 flex-col justify-between">
        <span className="block h-0.5 rounded-full bg-current" />
        <span className="block h-0.5 rounded-full bg-current" />
        <span className="block h-0.5 rounded-full bg-current" />
      </span>
    </button>
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  const { open } = useSidebar()

  return (
    <div
      data-slot="sidebar-header"
      className={cn(
        "shrink-0 border-b border-sidebar-border",
        open ? "p-4" : "px-2 py-3",
        className
      )}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  const { open } = useSidebar()

  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden overscroll-contain",
        open ? "p-4" : "px-2 py-4",
        className
      )}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  const { open } = useSidebar()

  return (
    <div
      data-slot="sidebar-footer"
      className={cn(
        "mt-auto shrink-0 border-t border-sidebar-border bg-sidebar/95 backdrop-blur",
        open ? "p-4" : "px-1 py-2",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="sidebar-group"
      className={cn("space-y-2", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { open } = useSidebar()

  if (!open) {
    return null
  }

  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "px-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn("space-y-1", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu"
      className={cn("space-y-1", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  )
}

function SidebarMenuButton({
  asChild = false,
  children,
  className,
  isActive = false,
  size = "default",
  ...props
}: React.PropsWithChildren<
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    size?: "default" | "sm" | "lg"
    tooltip?: string
  }
>) {
  const { open } = useSidebar()
  const buttonClassName = cn(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
    size === "sm" && "px-2.5 py-1.5 text-xs",
    size === "lg" && "px-3.5 py-2.5",
    !open && "justify-center px-0",
    className
  )

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>

    return React.cloneElement(child, {
      className: cn(buttonClassName, child.props.className),
    })
  }

  return (
    <button type="button" className={buttonClassName} {...props}>
      {children}
    </button>
  )
}

function SidebarMenuAction({
  asChild = false,
  children,
  className,
  ...props
}: React.PropsWithChildren<
  React.ComponentProps<"button"> & { asChild?: boolean; showOnHover?: boolean }
>) {
  const actionClassName = cn(
    "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    className
  )

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>

    return React.cloneElement(child, {
      className: cn(actionClassName, child.props.className),
    })
  }

  return (
    <button type="button" className={actionClassName} {...props}>
      {children}
    </button>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-sub"
      className={cn("mt-2 ml-4 space-y-1 border-l border-sidebar-border pl-3", className)}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-sub-item"
      className={cn("relative", className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  asChild = false,
  children,
  className,
  isActive = false,
  ...props
}: React.PropsWithChildren<
  React.ComponentProps<"button"> & { asChild?: boolean; isActive?: boolean }
>) {
  const buttonClassName = cn(
    "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
    className
  )

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>

    return React.cloneElement(child, {
      className: cn(buttonClassName, child.props.className),
    })
  }

  return (
    <button type="button" className={buttonClassName} {...props}>
      {children}
    </button>
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  // eslint-disable-next-line react-refresh/only-export-components
  useSidebar,
}
