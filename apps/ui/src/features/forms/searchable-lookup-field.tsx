"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type SearchableLookupOption = {
  label: string
  value: string
}

export function SearchableLookupField({
  allowEmptyOption,
  createActionLabel,
  disabled,
  emptyOptionLabel = "Select",
  error,
  noResultsMessage = "No records found.",
  onCreateNew,
  onValueChange,
  options,
  placeholder = "Select option",
  searchPlaceholder = "Search option",
  value,
}: {
  allowEmptyOption?: boolean
  createActionLabel?: string
  disabled?: boolean
  emptyOptionLabel?: string
  error?: string | null
  noResultsMessage?: string
  onCreateNew?: (query: string) => void
  onValueChange: (value: string) => void
  options: SearchableLookupOption[]
  placeholder?: string
  searchPlaceholder?: string
  value?: string
}) {
  const lookupMenuHeight = 320
  const lookupViewportGap = 12
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [menuStyle, setMenuStyle] = useState<{
    top?: number
    bottom?: number
    left?: number
    width?: number
    maxHeight: number
    openUpward: boolean
    withinDialog: boolean
  } | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const resolvedValue = value || (allowEmptyOption ? "__empty__" : "")
  const selectedOption = options.find((option) => option.value === value) ?? null
  const hasDatabaseFallbackOption = useMemo(
    () => options.some((option) => option.label.trim() === "-" || option.value === "1"),
    [options]
  )
  const showEmptyOption = Boolean(allowEmptyOption && !hasDatabaseFallbackOption)
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return options
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
  }, [options, query])
  const canCreateOption = Boolean(onCreateNew && query.trim().length > 0)
  const totalItems = filteredOptions.length + (showEmptyOption ? 1 : 0)
  const createItemIndex = canCreateOption ? totalItems : -1

  useEffect(() => {
    let focusFrame = 0
    let focusTimeout: number | null = null

    function syncMenuPosition() {
      const trigger = triggerRef.current
      if (!trigger) {
        return
      }

      const withinDialog = Boolean(trigger.closest('[role="dialog"]'))
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - lookupViewportGap
      const spaceAbove = rect.top - lookupViewportGap
      const shouldOpenUpward = spaceBelow < lookupMenuHeight && spaceAbove > spaceBelow
      const availableHeight = shouldOpenUpward
        ? Math.max(spaceAbove, 180)
        : Math.max(spaceBelow, 180)
      const maxHeight = Math.min(lookupMenuHeight, availableHeight)
      const top = shouldOpenUpward ? undefined : rect.bottom + 8
      const bottom = shouldOpenUpward ? window.innerHeight - rect.top + 8 : undefined

      setMenuStyle({
        maxHeight,
        openUpward: shouldOpenUpward,
        withinDialog,
        ...(withinDialog
          ? {}
          : {
              top,
              bottom,
              left: rect.left,
              width: rect.width,
            }),
      })
    }

    if (!open) {
      setQuery("")
      setHighlightedIndex(0)
      setMenuStyle(null)
      return
    }

    syncMenuPosition()
    setHighlightedIndex(showEmptyOption ? 1 : 0)
    focusFrame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
      focusTimeout = window.setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    })
    window.addEventListener("resize", syncMenuPosition)
    window.addEventListener("scroll", syncMenuPosition, true)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      if (focusTimeout) {
        window.clearTimeout(focusTimeout)
      }
      window.removeEventListener("resize", syncMenuPosition)
      window.removeEventListener("scroll", syncMenuPosition, true)
    }
  }, [open, showEmptyOption])

  useEffect(() => {
    const maxIndex = canCreateOption ? totalItems : Math.max(totalItems - 1, 0)
    setHighlightedIndex((current) => Math.min(current, maxIndex))
  }, [canCreateOption, totalItems])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function closeMenu() {
    setOpen(false)
    setQuery("")
    triggerRef.current?.focus()
  }

  function handleSelect(nextValue: string) {
    onValueChange(nextValue)
    closeMenu()
  }

  function handleCreateNew() {
    if (!onCreateNew || !query.trim()) {
      return
    }

    onCreateNew(query.trim())
    setOpen(false)
    setQuery("")
    triggerRef.current?.focus()
  }

  function moveHighlight(direction: 1 | -1) {
    const itemCount = canCreateOption ? totalItems + 1 : totalItems
    if (itemCount <= 0) {
      return
    }

    setHighlightedIndex((current) => {
      const next = current + direction
      if (next < 0) {
        return itemCount - 1
      }
      if (next >= itemCount) {
        return 0
      }
      return next
    })
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement | HTMLInputElement>) {
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
      return
    }

    if (!open) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveHighlight(1)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      moveHighlight(-1)
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      closeMenu()
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()

      if (showEmptyOption && highlightedIndex === 0) {
        handleSelect("")
        return
      }

      const optionIndex = highlightedIndex - (showEmptyOption ? 1 : 0)
      if (optionIndex >= 0 && optionIndex < filteredOptions.length) {
        handleSelect(filteredOptions[optionIndex].value)
        return
      }

      if (highlightedIndex === createItemIndex) {
        handleCreateNew()
      }
    }
  }

  const menuContent = menuStyle ? (
    <>
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={searchPlaceholder}
        className="mb-1.5 flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      <div
        className="overflow-y-auto pr-1 [scrollbar-color:hsl(var(--border))_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
        style={{ maxHeight: Math.max(menuStyle.maxHeight - 44, 128) }}
      >
        {showEmptyOption ? (
          <button
            type="button"
            className={cn(
              "flex min-h-9 w-full items-center justify-between rounded-sm px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/70",
              highlightedIndex === 0 ? "bg-muted/70" : undefined
            )}
            onClick={() => handleSelect("")}
          >
            <span>{emptyOptionLabel}</span>
            {resolvedValue === "__empty__" ? <CheckIcon className="size-4" /> : null}
          </button>
        ) : null}
        {filteredOptions.map((option, index) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "flex min-h-9 w-full items-center justify-between rounded-sm px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/70",
              highlightedIndex === index + (showEmptyOption ? 1 : 0) ? "bg-muted/70" : undefined
            )}
            onClick={() => handleSelect(option.value)}
          >
            <span className="truncate">{option.label}</span>
            {option.value === value ? <CheckIcon className="size-4" /> : null}
          </button>
        ))}
        {filteredOptions.length === 0 ? (
          <div className="space-y-2 px-2 py-2">
            <p className="text-sm text-muted-foreground">{noResultsMessage}</p>
            {canCreateOption ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "w-full justify-between rounded-sm border-dashed px-3",
                  highlightedIndex === createItemIndex ? "bg-muted/70" : undefined
                )}
                onClick={handleCreateNew}
              >
                <span>{createActionLabel ?? `Create new "${query.trim()}"`}</span>
                <PlusIcon className="size-4" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  ) : null

  return (
    <div ref={rootRef} className={cn("relative", open ? "z-[230]" : undefined)}>
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-destructive focus-visible:border-destructive/70 focus-visible:ring-destructive/25"
            : undefined
        )}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span
          className={cn(
            "truncate text-left",
            !selectedOption && !(showEmptyOption && resolvedValue === "__empty__")
              ? "text-muted-foreground"
              : undefined
          )}
        >
          {selectedOption?.label ??
            (showEmptyOption && resolvedValue === "__empty__" ? emptyOptionLabel : placeholder)}
        </span>
        <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && menuStyle
        ? menuStyle.withinDialog
          ? (
            <div
              ref={menuRef}
              className={cn(
                "absolute z-[220] w-full rounded-md border border-border bg-popover p-2 shadow-md",
                menuStyle.openUpward ? "bottom-full mb-2" : "top-full mt-2"
              )}
            >
              {menuContent}
            </div>
            )
          : typeof document !== "undefined"
            ? createPortal(
              <div
                ref={menuRef}
                className="fixed z-[200] rounded-md border border-border bg-popover p-2 shadow-md"
                style={{
                  top: menuStyle.top,
                  bottom: menuStyle.bottom,
                  left: menuStyle.left,
                  width: menuStyle.width,
                  maxHeight: menuStyle.maxHeight,
                }}
              >
                {menuContent}
              </div>,
              document.body
            )
            : null
        : null}
    </div>
  )
}
