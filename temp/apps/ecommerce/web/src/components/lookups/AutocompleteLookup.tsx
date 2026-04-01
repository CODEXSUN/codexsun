import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LookupOption } from '@/shared/forms/common-lookup'

type AutocompleteLookupProps = {
  value: string
  onChange: (value: string) => void
  options: LookupOption[]
  placeholder?: string
  required?: boolean
  allowEmptyOption?: boolean
  emptyOptionLabel?: string
  onOptionsChange?: (options: LookupOption[]) => void
  onErrorChange?: (message: string) => void
  createOption?: (label: string) => Promise<LookupOption>
}

export function AutocompleteLookup({
  value,
  onChange,
  options,
  placeholder,
  allowEmptyOption,
  emptyOptionLabel = 'Select',
  onOptionsChange,
  onErrorChange,
  createOption,
}: AutocompleteLookupProps) {
  const LOOKUP_MENU_HEIGHT = 320
  const LOOKUP_VIEWPORT_GAP = 12
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [creating, setCreating] = useState(false)
  const [menuStyle, setMenuStyle] = useState<{
    top?: number
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

  const resolvedValue = value || (allowEmptyOption ? '__empty__' : '')
  const selectedOption = options.find((option) => option.value === value)

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return options
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
  }, [options, query])

  const hasDatabaseFallbackOption = useMemo(
    () => options.some((option) => option.label.trim() === '-' || option.value === '1'),
    [options],
  )
  const showEmptyOption = Boolean(allowEmptyOption && !hasDatabaseFallbackOption)

  const canCreateOption = Boolean(createOption && query.trim().length > 0)
  const totalItems = filteredOptions.length + (showEmptyOption ? 1 : 0)
  const createItemIndex = canCreateOption ? totalItems : -1

  useEffect(() => {
    function syncMenuPosition() {
      const trigger = triggerRef.current
      if (!trigger) {
        return
      }

      const withinDialog = Boolean(trigger.closest('[role="dialog"]'))
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - LOOKUP_VIEWPORT_GAP
      const spaceAbove = rect.top - LOOKUP_VIEWPORT_GAP
      const shouldOpenUpward = spaceBelow < LOOKUP_MENU_HEIGHT && spaceAbove > spaceBelow
      const availableHeight = shouldOpenUpward ? Math.max(spaceAbove, 180) : Math.max(spaceBelow, 180)
      const maxHeight = Math.min(LOOKUP_MENU_HEIGHT, availableHeight)
      const top = shouldOpenUpward
        ? Math.max(LOOKUP_VIEWPORT_GAP, rect.top - maxHeight - 8)
        : rect.bottom + 8

      setMenuStyle({
        maxHeight,
        openUpward: shouldOpenUpward,
        withinDialog,
        ...(withinDialog ? {} : {
          top,
          left: rect.left,
          width: rect.width,
        }),
      })
    }

    if (!open) {
      setQuery('')
      setHighlightedIndex(0)
      setMenuStyle(null)
      return
    }

    syncMenuPosition()
    setHighlightedIndex(showEmptyOption ? 1 : 0)
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    window.addEventListener('resize', syncMenuPosition)
    window.addEventListener('scroll', syncMenuPosition, true)

    return () => {
      window.removeEventListener('resize', syncMenuPosition)
      window.removeEventListener('scroll', syncMenuPosition, true)
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

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleCreateOption() {
    if (!createOption || !query.trim()) {
      return
    }

    setCreating(true)
    onErrorChange?.('')

    try {
      const createdOption = await createOption(query.trim())
      onOptionsChange?.([...options, createdOption])
      onChange(createdOption.value)
      setOpen(false)
      setQuery('')
      triggerRef.current?.focus()
    } catch (error) {
      onErrorChange?.(error instanceof Error ? error.message : 'Failed to create option.')
    } finally {
      setCreating(false)
    }
  }

  function closeMenu() {
    setOpen(false)
    setQuery('')
    triggerRef.current?.focus()
  }

  function selectOption(nextValue: string) {
    onErrorChange?.('')
    onChange(nextValue)
    closeMenu()
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
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
      return
    }

    if (!open) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveHighlight(1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveHighlight(-1)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu()
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      if (showEmptyOption && highlightedIndex === 0) {
        selectOption('')
        return
      }

      const optionIndex = highlightedIndex - (showEmptyOption ? 1 : 0)
      if (optionIndex >= 0 && optionIndex < filteredOptions.length) {
        selectOption(filteredOptions[optionIndex].value)
        return
      }

      if (highlightedIndex === createItemIndex) {
        void handleCreateOption()
      }
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', open ? 'z-[230]' : undefined)}>
      <button
        type="button"
        ref={triggerRef}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
        )}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span className={cn('truncate text-left', !selectedOption && !allowEmptyOption ? 'text-muted-foreground' : undefined)}>
          {selectedOption?.label ?? (showEmptyOption && resolvedValue === '__empty__' ? emptyOptionLabel : placeholder ?? 'Select option')}
        </span>
        <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && menuStyle ? (
        menuStyle.withinDialog ? (
          <div
            ref={menuRef}
            className={cn(
              'absolute z-[220] w-full rounded-md border border-border bg-popover p-2 shadow-md',
              menuStyle.openUpward ? 'bottom-full mb-2' : 'top-full mt-2',
            )}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder ?? 'Search option'}
              className="mb-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
            <div
              className="overflow-y-auto pr-1 [scrollbar-color:hsl(var(--border))_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
              style={{ maxHeight: Math.max(menuStyle.maxHeight - 52, 128) }}
            >
              {showEmptyOption ? (
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-muted/70',
                    highlightedIndex === 0 ? 'bg-muted/70' : undefined,
                  )}
                  onClick={() => {
                    selectOption('')
                  }}
                >
                  <span>{emptyOptionLabel}</span>
                  {resolvedValue === '__empty__' ? <Check className="size-4" /> : null}
                </button>
              ) : null}
              {filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-muted/70',
                    highlightedIndex === index + (showEmptyOption ? 1 : 0) ? 'bg-muted/70' : undefined,
                  )}
                  onClick={() => {
                    selectOption(option.value)
                  }}
                >
                  <span>{option.label}</span>
                  {option.value === value ? <Check className="size-4" /> : null}
                </button>
              ))}
              {filteredOptions.length === 0 ? (
                <div className="space-y-2 px-2 py-2">
                  <p className="text-sm text-muted-foreground">No results found.</p>
                  {canCreateOption ? (
                    <button
                      type="button"
                      className={cn(
                        'flex w-full items-center justify-between rounded-sm border border-dashed border-border px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/70',
                        highlightedIndex === createItemIndex ? 'bg-muted/70' : undefined,
                      )}
                      onClick={() => void handleCreateOption()}
                      disabled={creating}
                    >
                      <span>{creating ? 'Creating...' : `Create "${query.trim()}"`}</span>
                      <span className="text-xs text-muted-foreground">Enter</span>
                    </button>
                  ) : null}
                </div>
              ) : null}
              {filteredOptions.length > 0 && canCreateOption ? (
                <button
                  type="button"
                  className={cn(
                    'mt-2 flex w-full items-center justify-between rounded-sm border border-dashed border-border px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/70',
                    highlightedIndex === createItemIndex ? 'bg-muted/70' : undefined,
                  )}
                  onClick={() => void handleCreateOption()}
                  disabled={creating}
                >
                  <span>{creating ? 'Creating...' : `Create "${query.trim()}"`}</span>
                  <span className="text-xs text-muted-foreground">Enter</span>
                </button>
              ) : null}
            </div>
          </div>
        ) : typeof document !== 'undefined' ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200] rounded-md border border-border bg-popover p-2 shadow-md"
            style={{
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
            }}
          >
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? 'Search option'}
            className="mb-2 flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <div
            className="overflow-y-auto pr-1 [scrollbar-color:hsl(var(--border))_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
            style={{ maxHeight: Math.max(menuStyle.maxHeight - 52, 128) }}
          >
            {showEmptyOption ? (
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-muted/70',
                  highlightedIndex === 0 ? 'bg-muted/70' : undefined,
                )}
                onClick={() => {
                  selectOption('')
                }}
              >
                <span>{emptyOptionLabel}</span>
                {resolvedValue === '__empty__' ? <Check className="size-4" /> : null}
              </button>
            ) : null}
            {filteredOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-muted/70',
                  highlightedIndex === index + (showEmptyOption ? 1 : 0) ? 'bg-muted/70' : undefined,
                )}
                onClick={() => {
                  selectOption(option.value)
                }}
              >
                <span>{option.label}</span>
                {option.value === value ? <Check className="size-4" /> : null}
              </button>
            ))}
            {filteredOptions.length === 0 ? (
              <div className="space-y-2 px-2 py-2">
                <p className="text-sm text-muted-foreground">No results found.</p>
                {canCreateOption ? (
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between rounded-sm border border-dashed border-border px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/70',
                      highlightedIndex === createItemIndex ? 'bg-muted/70' : undefined,
                    )}
                    onClick={() => void handleCreateOption()}
                    disabled={creating}
                  >
                    <span>{creating ? 'Creating...' : `Create "${query.trim()}"`}</span>
                    <span className="text-xs text-muted-foreground">Enter</span>
                  </button>
                ) : null}
              </div>
            ) : null}
            {filteredOptions.length > 0 && canCreateOption ? (
              <button
                type="button"
                className={cn(
                  'mt-2 flex w-full items-center justify-between rounded-sm border border-dashed border-border px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/70',
                  highlightedIndex === createItemIndex ? 'bg-muted/70' : undefined,
                )}
                onClick={() => void handleCreateOption()}
                disabled={creating}
              >
                <span>{creating ? 'Creating...' : `Create "${query.trim()}"`}</span>
                <span className="text-xs text-muted-foreground">Enter</span>
              </button>
            ) : null}
          </div>
          </div>,
          document.body,
        ) : null
      ) : null}
    </div>
  )
}
