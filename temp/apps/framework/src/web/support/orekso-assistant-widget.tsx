import type { SupportAssistantSource, SupportAssistantStatus } from '@shared/index'
import { useEffect, useMemo, useRef, useState, startTransition } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { MessageCircle, RefreshCcw, Send, Sparkles, X } from 'lucide-react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { askSupportAssistant, getSupportAssistantStatus, HttpError, reindexSupportAssistant } from '@/shared/api/client'

interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  text: string
  sources?: SupportAssistantSource[]
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `orekso-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`
}

function getWorkspaceFromPath(pathname: string) {
  if (pathname.startsWith('/admin/dashboard/billing')) return 'billing'
  if (pathname.startsWith('/admin/dashboard/frappe')) return 'frappe'
  if (pathname.startsWith('/admin/dashboard/task')) return 'task'
  if (pathname.startsWith('/admin/dashboard')) return 'admin'
  if (pathname.startsWith('/dashboard')) return 'customer'
  if (pathname.startsWith('/product') || pathname.startsWith('/category') || pathname.startsWith('/search')) return 'store'
  return 'web'
}

function buildGreeting(status: SupportAssistantStatus | null) {
  if (!status) {
    return 'Orekso is checking its connection.'
  }

  if (status.status === 'indexing') {
    return 'Orekso is learning Codexsun right now. You can still ask, but answers may be limited until indexing finishes.'
  }

  if (status.status === 'ready') {
    return 'Ask about entries, fields, statuses, or workflow steps. Orekso will answer from the curated Codexsun knowledge base.'
  }

  if (status.status === 'disabled') {
    return 'Orekso is disabled for this runtime.'
  }

  if (status.status === 'offline' || status.status === 'error') {
    return 'Orekso is currently unavailable. Try again after the assistant service is online.'
  }

  return status.summary
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to reach Orekso.'
}

function getStatusBadgeClass(status: SupportAssistantStatus | null) {
  const value = status?.status ?? 'loading'

  if (value === 'ready') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (value === 'indexing') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  if (value === 'offline' || value === 'error') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }

  if (value === 'disabled') {
    return 'border-slate-200 bg-slate-100 text-slate-600'
  }

  return 'border-sky-200 bg-sky-50 text-sky-700'
}

function OrbFace({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{
        y: [0, -5, 0],
        rotate: [0, 2, -2, 0],
        scale: [1, 1.04, 1],
      }}
      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3.2, ease: 'easeInOut' }}
      className={cn(
        'relative size-14 shrink-0 overflow-hidden rounded-full border border-white/70 shadow-[0_16px_40px_rgba(14,116,144,0.28)]',
        className,
      )}
      style={{
        background: 'radial-gradient(circle at 50% 42%, rgb(191 219 254 / 0.96) 0%, rgb(96 165 250 / 0.94) 40%, rgb(37 99 235 / 0.9) 100%)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-blue-950/15" />
      <motion.div
        animate={{ opacity: [0.75, 0.95, 0.75], scale: [1, 1.06, 1] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.8, ease: 'easeInOut' }}
        className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.98),rgba(255,255,255,0.24)_40%,transparent_70%)]"
      />
      <div className="absolute -left-2 bottom-1 h-8 w-8 rounded-full bg-sky-200/50 blur-md" />
      <div className="absolute -right-2 top-2 h-8 w-8 rounded-full bg-blue-100/55 blur-md" />
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 10, ease: 'linear' }}
        className="absolute inset-[10%] rounded-full border border-white/20 border-t-white/70 border-r-blue-100/60"
      />
      <motion.div
        animate={{ y: [0, 1, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.6, ease: 'easeInOut' }}
        className="absolute inset-0 z-20"
      >
        <div className="absolute left-1/2 top-1/2 h-[36%] w-[48%] -translate-x-1/2 -translate-y-[6%]">
          <motion.div
            animate={{ scaleY: [1, 0.94, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.8, ease: 'easeInOut' }}
            className="absolute left-[8%] top-[6%] flex h-[32%] w-[32%] items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,0.22)]"
          >
            <motion.div
              animate={{ x: [-0.6, 0.6, -0.6], y: [0, 0.4, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.5, ease: 'easeInOut' }}
              className="relative h-[56%] w-[56%] rounded-full bg-slate-950"
            >
              <div className="absolute left-[20%] top-[20%] h-[22%] w-[22%] rounded-full bg-white/90" />
            </motion.div>
          </motion.div>
          <motion.div
            animate={{ scaleY: [1, 0.94, 1] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.8, ease: 'easeInOut', delay: 0.08 }}
            className="absolute right-[8%] top-[6%] flex h-[32%] w-[32%] items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,0.22)]"
          >
            <motion.div
              animate={{ x: [0.6, -0.6, 0.6], y: [0, 0.4, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.5, ease: 'easeInOut' }}
              className="relative h-[56%] w-[56%] rounded-full bg-slate-950"
            >
              <div className="absolute left-[20%] top-[20%] h-[22%] w-[22%] rounded-full bg-white/90" />
            </motion.div>
          </motion.div>
          <motion.svg
            animate={{ scaleX: [1, 1.06, 1], y: [0, 1, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.4, ease: 'easeInOut' }}
            viewBox="0 0 40 18"
            aria-hidden="true"
            className="absolute bottom-[4%] left-1/2 h-[28%] w-[72%] -translate-x-1/2 text-slate-950/90"
          >
            <path
              d="M6 5C9.5 11 14.5 14 20 14C25.5 14 30.5 11 34 5"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </motion.svg>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function OreksoAssistantWidget() {
  const { pathname } = useLocation()
  const { session } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [status, setStatus] = useState<SupportAssistantStatus | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const endRef = useRef<HTMLDivElement | null>(null)

  const workspace = useMemo(() => getWorkspaceFromPath(pathname), [pathname])
  const isVisible = status?.status !== 'disabled'
  const canReindex = Boolean(session?.user.isSuperAdmin)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [isOpen, isSending, messages])

  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      try {
        const nextStatus = await getSupportAssistantStatus()
        if (cancelled) {
          return
        }

        setStatus(nextStatus)
        setMessages((current) => current.length > 0 ? current : [{
          id: createId(),
          role: 'assistant',
          text: buildGreeting(nextStatus),
        }])
      } catch (error) {
        if (!cancelled) {
          const offlineStatus = {
            status: 'offline',
            assistantName: 'Orekso',
            summary: toErrorMessage(error),
            codexsunUrl: null,
            indexedFiles: 0,
            indexedChunks: 0,
            inProgress: false,
            lastIndexedAt: null,
            lastError: toErrorMessage(error),
          } satisfies SupportAssistantStatus
          setStatus(offlineStatus)
          setMessages((current) => current.length > 0 ? current : [{
            id: createId(),
            role: 'assistant',
            text: buildGreeting(offlineStatus),
          }])
        }
      }
    }

    void loadStatus()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSend() {
    const message = inputValue.trim()
    if (!message || isSending) {
      return
    }

    setInputValue('')
    startTransition(() => {
      setMessages((current) => [
        ...current,
        { id: createId(), role: 'user', text: message },
      ])
    })

    setIsSending(true)
    try {
      const response = await askSupportAssistant({
        message,
        pagePath: pathname,
        workspace,
      })
      setStatus(response.assistant)
      startTransition(() => {
        setMessages((current) => [
          ...current,
          {
            id: createId(),
            role: 'assistant',
            text: response.answer,
            sources: response.sources,
          },
        ])
      })
    } catch (error) {
      startTransition(() => {
        setMessages((current) => [
          ...current,
          {
            id: createId(),
            role: 'assistant',
            text: toErrorMessage(error),
          },
        ])
      })
    } finally {
      setIsSending(false)
    }
  }

  async function handleReindex() {
    if (!canReindex || isRefreshing) {
      return
    }

    setIsRefreshing(true)
    try {
      const nextStatus = await reindexSupportAssistant(session!.accessToken)
      setStatus(nextStatus)
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          text: 'Knowledge refresh started. Orekso will keep answering while the new index is being prepared.',
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          text: toErrorMessage(error),
        },
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!isMounted || !isVisible) {
    return null
  }

  return createPortal(
    <div
      className="fixed z-[2147483647]"
      style={{
        right: '1rem',
        bottom: '1rem',
        display: 'flex',
        maxWidth: 'calc(100vw - 1.5rem)',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.75rem',
        isolation: 'isolate',
      }}
    >
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="pointer-events-auto"
        >
          <Card className="flex h-[min(580px,calc(100vh-7rem))] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[28px] border border-border/80 bg-background/98 shadow-[0_26px_80px_rgba(15,23,42,0.24)] backdrop-blur-xl">
            <CardHeader className="relative overflow-hidden bg-slate-950 p-0 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.28),transparent_40%)]" />
              <div className="relative flex items-start gap-3 px-5 py-4">
                <OrbFace className="size-12 shadow-[0_12px_30px_rgba(14,116,144,0.22)]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold tracking-wide text-white">Orekso</p>
                        <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]', getStatusBadgeClass(status))}>
                          {status?.status ?? 'loading'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-sky-100/80">
                        {status?.summary ?? 'Loading assistant status.'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setIsOpen(false)}
                      className="rounded-full text-white hover:bg-white/10 hover:text-white"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-sky-100/75">
                    <span>{status?.indexedFiles ?? 0} files</span>
                    <span>{status?.indexedChunks ?? 0} chunks</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(241,245,249,0.94)_100%)] px-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm',
                        message.role === 'user'
                          ? 'rounded-br-md bg-[linear-gradient(135deg,#2563eb_0%,#38bdf8_100%)] text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)]'
                          : 'rounded-bl-md border border-border/80 bg-card text-card-foreground shadow-[0_10px_24px_rgba(15,23,42,0.08)]',
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-6">{message.text}</p>
                      {message.sources && message.sources.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {message.sources.slice(0, 3).map((source) => (
                            <div
                              key={`${source.filePath}-${source.topic}`}
                              className="rounded-2xl border border-border/80 bg-muted/70 px-3 py-2 text-xs text-muted-foreground"
                            >
                              <div className="break-all font-medium text-foreground">{source.filePath}</div>
                              <div className="mt-1 leading-5">{source.snippet}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {isSending ? (
                  <div className="flex justify-start">
                    <div className="rounded-3xl rounded-bl-md border border-border/80 bg-card px-4 py-3 text-sm text-muted-foreground shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                      Orekso is thinking...
                    </div>
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>

              <div className="border-t border-border/80 bg-background/95 p-4 backdrop-blur-xl">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="size-4 shrink-0 text-sky-500" />
                    <span className="truncate">
                      Context: <span className="font-medium text-foreground">{workspace}</span> on {pathname}
                    </span>
                  </div>
                  {canReindex ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleReindex()}
                      disabled={isRefreshing}
                      className="shrink-0 rounded-full border-border/80 bg-background shadow-sm"
                    >
                      <RefreshCcw className={cn('size-4', isRefreshing ? 'animate-spin' : '')} />
                      {isRefreshing ? 'Refreshing' : 'Reindex'}
                    </Button>
                  ) : null}
                </div>

                <div className="flex items-end gap-3">
                  <Textarea
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder="Ask how to enter data, what a field means, or why a step failed."
                    className="min-h-[56px] resize-none rounded-2xl border-border/80 bg-background shadow-sm"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        void handleSend()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    onClick={() => void handleSend()}
                    disabled={isSending || inputValue.trim().length === 0}
                    className="rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#38bdf8_100%)] text-white shadow-[0_14px_28px_rgba(37,99,235,0.22)] hover:brightness-105 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      <motion.button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="pointer-events-auto flex min-h-[58px] items-center gap-2.5 rounded-full border border-white/45 px-2.5 py-2 text-white shadow-[0_22px_50px_-24px_rgba(15,23,42,0.85)]"
        style={{
          background: 'linear-gradient(120deg, rgb(30 64 175 / 0.96) 0%, rgb(59 130 246 / 0.94) 52%, rgb(147 197 253 / 0.92) 100%)',
          color: '#ffffff',
          backdropFilter: 'blur(10px)',
        }}
      >
        <OrbFace className="size-11" />
        <div className="hidden min-w-0 text-left sm:block">
          <div className="text-sm font-semibold text-white">Ask Orekso</div>
          <div className="text-xs text-sky-100/75">AI help for entries and workflows</div>
        </div>
        <MessageCircle className="size-4 text-sky-100 sm:hidden" />
      </motion.button>
    </div>,
    document.body,
  )
}
