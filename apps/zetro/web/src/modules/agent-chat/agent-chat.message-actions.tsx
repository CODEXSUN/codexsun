import { useState, type ComponentType } from 'react'
import {
  Archive,
  Check,
  Clipboard,
  Ellipsis,
  ListTodo,
  MessageSquareText,
  ScanSearch,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@codexsun/ui/components/dropdown-menu'
import { useAgentChat } from './agent-chat.controller'
import type { ChatMessage } from './agent-chat.types'

type ActionIcon = ComponentType<{ className?: string }>

const responseActions = [
  { icon: Sparkles, label: 'Actions' },
  { icon: ScanSearch, label: 'Review prompt' },
  { icon: MessageSquareText, label: 'Review chat' },
  { icon: ListTodo, label: 'Send to task' },
] as const

export function AgentChatMessageActions({ message }: { message: ChatMessage }) {
  const chat = useAgentChat()
  const [copied, setCopied] = useState(false)
  const activeConversation = chat.summaries.find(({ id }) => id === chat.activeId)

  async function copyResponse() {
    await copyText(message.content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div
      aria-label={message.role === 'user' ? 'Prompt actions' : 'Response actions'}
      className="flex min-h-7 items-center gap-0.5 pt-2 text-muted-foreground opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100"
      role="toolbar"
    >
      <ActionButton
        icon={copied ? Check : Clipboard}
        label={copied ? 'Copied' : 'Copy'}
        onClick={() => void copyResponse()}
      />
      {message.role === 'user' ? <PendingActionMenu icon={ScanSearch} label="Analysis" /> : null}
      {message.role === 'assistant'
        ? responseActions.map((action) => (
            <PendingActionMenu icon={action.icon} key={action.label} label={action.label} />
          ))
        : null}
      {message.role === 'assistant' ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label="More response actions"
                className="ml-auto cursor-pointer"
                size="icon-sm"
                title="More actions"
                variant="ghost"
              />
            }
          >
            <Ellipsis className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer" onClick={() => void copyResponse()}>
              <Clipboard />
              Copy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={!activeConversation || chat.isBusy}
              onClick={() => {
                if (activeConversation) void chat.archiveConversation(activeConversation)
              }}
            >
              <Archive />
              Archive chat
            </DropdownMenuItem>
            <DropdownMenuItem disabled variant="destructive">
              <Trash2 />
              Delete
              <DropdownMenuShortcut>Archive first</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ActionIcon
  label: string
  onClick(): void
}) {
  return (
    <Button
      aria-label={label}
      className="cursor-pointer"
      onClick={onClick}
      size="icon-xs"
      title={label}
      variant="ghost"
    >
      <Icon />
    </Button>
  )
}

function PendingActionMenu({ icon: Icon, label }: { icon: ActionIcon; label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={label}
            className="cursor-pointer"
            size="icon-xs"
            title={label}
            variant="ghost"
          />
        }
      >
        <Icon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuItem disabled>Ready to bind later</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}
