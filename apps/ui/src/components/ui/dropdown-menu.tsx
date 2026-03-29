import * as React from "react"

import { cn } from "@/lib/utils"

type DropdownMenuContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(
  null
)

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext)

  if (!context) {
    throw new Error("Dropdown menu components must be used within DropdownMenu.")
  }

  return context
}

function DropdownMenu({ children }: React.PropsWithChildren) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className="relative" data-slot="dropdown-menu">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

function DropdownMenuTrigger({
  asChild = false,
  children,
  className,
}: React.PropsWithChildren<{
  asChild?: boolean
  className?: string
}>) {
  const { open, setOpen } = useDropdownMenuContext()

  const toggle = (event?: React.MouseEvent) => {
    event?.preventDefault()
    setOpen((value) => !value)
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      className?: string
      onClick?: (event: React.MouseEvent) => void
    }>

    return React.cloneElement(child, {
      className: cn(className, child.props.className),
      onClick: (event: React.MouseEvent) => {
        child.props.onClick?.(event)
        if (!event.defaultPrevented) {
          toggle(event)
        }
      },
    })
  }

  return (
    <button
      type="button"
      className={className}
      data-state={open ? "open" : "closed"}
      onClick={toggle}
    >
      {children}
    </button>
  )
}

function DropdownMenuContent({
  align = "start",
  children,
  className,
  side = "bottom",
  sideOffset = 8,
}: React.PropsWithChildren<{
  align?: "start" | "end" | "center"
  className?: string
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
}>) {
  const { open } = useDropdownMenuContext()

  if (!open) {
    return null
  }

  const sideClassName =
    side === "top"
      ? "bottom-full mb-2"
      : side === "right"
        ? "left-full ml-2 top-0"
        : side === "left"
          ? "right-full mr-2 top-0"
          : "top-full mt-2"
  const alignClassName =
    align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"

  return (
    <div
      data-slot="dropdown-menu-content"
      style={{ ["--dropdown-offset" as string]: `${sideOffset}px` }}
      className={cn(
        "absolute z-50 min-w-48 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg",
        sideClassName,
        alignClassName,
        className
      )}
    >
      {children}
    </div>
  )
}

function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-label"
      className={cn("px-2 py-1.5 text-sm font-medium", className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-separator"
      className={cn("my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function DropdownMenuGroup({ children }: React.PropsWithChildren) {
  return <div data-slot="dropdown-menu-group">{children}</div>
}

function DropdownMenuItem({
  asChild = false,
  children,
  className,
  onSelect,
  ...props
}: React.PropsWithChildren<
  React.ComponentProps<"button"> & {
    asChild?: boolean
    onSelect?: (event: React.MouseEvent<HTMLElement>) => void
  }
>) {
  const { setOpen } = useDropdownMenuContext()

  const handleSelect = (event: React.MouseEvent<HTMLElement>) => {
    onSelect?.(event)

    if (!event.defaultPrevented) {
      setOpen(false)
    }
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      className?: string
      onClick?: (event: React.MouseEvent<HTMLElement>) => void
    }>

    return React.cloneElement(child, {
      className: cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted",
        className,
        child.props.className
      ),
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        child.props.onClick?.(event)
        handleSelect(event)
      },
    })
  }

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted",
        className
      )}
      onClick={handleSelect}
      {...props}
    >
      {children}
    </button>
  )
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}
