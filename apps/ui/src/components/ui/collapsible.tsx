import * as React from "react"

import { cn } from "@/lib/utils"

type CollapsibleContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(
  null
)

function useCollapsibleContext() {
  const context = React.useContext(CollapsibleContext)

  if (!context) {
    throw new Error("Collapsible components must be used within Collapsible.")
  }

  return context
}

function Collapsible({
  children,
  className,
  defaultOpen = false,
}: React.PropsWithChildren<{
  asChild?: boolean
  className?: string
  defaultOpen?: boolean
}>) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <div
        data-slot="collapsible"
        data-state={open ? "open" : "closed"}
        className={className}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

function CollapsibleTrigger({
  asChild = false,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { open, setOpen } = useCollapsibleContext()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(event)
    if (!event.defaultPrevented) {
      setOpen((value) => !value)
    }
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      className?: string
      onClick?: React.MouseEventHandler<HTMLElement>
    }>

    return React.cloneElement(child, {
      className: cn(className, child.props.className),
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        child.props.onClick?.(event)
        if (!event.defaultPrevented) {
          setOpen((value) => !value)
        }
      },
    })
  }

  return (
    <button
      type="button"
      data-slot="collapsible-trigger"
      data-state={open ? "open" : "closed"}
      className={className}
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

function CollapsibleContent({
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open } = useCollapsibleContext()

  if (!open) {
    return null
  }

  return (
    <div data-slot="collapsible-content" {...props}>
      {children}
    </div>
  )
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger }
