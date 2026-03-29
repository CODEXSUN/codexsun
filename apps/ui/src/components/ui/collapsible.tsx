import * as React from "react"

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
  defaultOpen = false,
}: React.PropsWithChildren<{ asChild?: boolean; defaultOpen?: boolean }>) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <div data-slot="collapsible" data-state={open ? "open" : "closed"}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

function CollapsibleTrigger({
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

  return (
    <button
      type="button"
      data-slot="collapsible-trigger"
      data-state={open ? "open" : "closed"}
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
