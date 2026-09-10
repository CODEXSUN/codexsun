import { useState, type ComponentType } from 'react'
import {
  Archive,
  Check,
  Clipboard,
  Ellipsis,
  ListTodo,
  LoaderCircle,
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
import { taskInputFromPlan } from './agent-chat.task-draft'
import type { ChatMessage } from './agent-chat.types'
import { useProjectTasks } from '../project-tasks'
import { useProjects } from '../projects'

type ActionIcon = ComponentType<{ className?: string }>

const responseActions = [
  { icon: Sparkles, label: 'Actions' },
  { icon: ScanSearch, label: 'Review prompt' },
  { icon: MessageSquareText, label: 'Review chat' },
] as const

export function AgentChatMessageActions({ message }: { message: ChatMessage }) {
  const chat = useAgentChat()
  const projects = useProjects()
  const tasks = useProjectTasks()
  const [copied, setCopied] = useState(false)
  const [isSendingToTask, setIsSendingToTask] = useState(false)
  const [taskSendFailed, setTaskSendFailed] = useState(false)
  const activeConversation = chat.summaries.find(({ id }) => id === chat.activeId)
  const taskDraft = message.execution?.workflow === 'plan'

  async function copyResponse() {
    await copyText(message.content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function sendToTask() {
    const input = taskDraft
      ? taskInputFromPlan(message.content, chat.scope ?? undefined, chat.activeId)
      : taskInputFromMessage(message.content)
    setIsSendingToTask(true)
    setTaskSendFailed(false)
    try {
      await tasks.addTask(input)
      projects.setView('tasks')
    } catch {
      setTaskSendFailed(true)
    } finally {
      setIsSendingToTask(false)
    }
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
        <ActionButton
          disabled={isSendingToTask || chat.isBusy}
          icon={isSendingToTask ? LoaderCircle : ListTodo}
          iconClassName={isSendingToTask ? 'animate-spin' : undefined}
          label={
            isSendingToTask
              ? 'Sending to task'
              : taskSendFailed
                ? 'Task send failed'
                : taskDraft
                  ? 'Create task draft'
                  : 'Create follow-up task'
          }
          onClick={() => void sendToTask()}
        />
      ) : null}
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
  disabled,
  icon: Icon,
  iconClassName,
  label,
  onClick,
}: {
  disabled?: boolean
  icon: ActionIcon
  iconClassName?: string
  label: string
  onClick(): void
}) {
  return (
    <Button
      aria-label={label}
      className="cursor-pointer"
      disabled={disabled}
      onClick={onClick}
      size="icon-xs"
      title={label}
      variant="ghost"
    >
      <Icon className={iconClassName} />
    </Button>
  )
}

function taskInputFromMessage(content: string) {
  const title = findLabeledValue(content, 'Title') ?? firstContentLine(content) ?? 'Chat follow-up'
  const description = findLabeledSection(content, 'Task') ?? content
  return {
    description: description.trim().slice(0, 2_000),
    priority: 'medium' as const,
    title: cleanMarkdown(title).slice(0, 160),
  }
}

function findLabeledValue(content: string, label: string): string | null {
  const match = content.match(new RegExp(`^\\s*(?:\\*\\*)?${label}:(?:\\*\\*)?\\s*(.+)$`, 'im'))
  return match?.[1]?.trim() || null
}

function findLabeledSection(content: string, label: string): string | null {
  const match = content.match(
    new RegExp(`^\\s*(?:\\*\\*)?${label}:(?:\\*\\*)?\\s*([\\s\\S]+)$`, 'im'),
  )
  return match?.[1]?.trim() || null
}

function firstContentLine(content: string): string | null {
  return (
    content
      .split('\n')
      .map((line) => cleanMarkdown(line).trim())
      .find(Boolean) ?? null
  )
}

function cleanMarkdown(value: string): string {
  return value.replace(/[*_`#]/g, '').trim()
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
