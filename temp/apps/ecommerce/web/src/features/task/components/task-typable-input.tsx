import type { TaskPriority, TaskScopeType, TaskTemplateSummary } from '@shared/index'
import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'

type WizardIntent = 'verify' | 'fix' | 'general' | 'other'

export interface ParsedTaskSuggestion {
  intent: WizardIntent | null
  templateId: string | null
  entityType: TaskScopeType | null
  entityId: string | null
  entityLabel: string | null
  assigneeId: string | null
  assigneeName: string | null
  priority: TaskPriority | null
  dueDate: string | null
  chips: string[]
}

interface TaskTypableInputProps {
  value: string
  onChange: (value: string) => void
  templates: TaskTemplateSummary[]
  users: { id: string; name: string }[]
  products: { id: string; name: string }[]
  currentUserId: string | null
  currentUserName: string | null
  onApply: (parsed: ParsedTaskSuggestion) => void
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function includesWord(text: string, keyword: string) {
  return text.includes(keyword)
}

export function useTaskParser(inputText: string, context: Omit<TaskTypableInputProps, 'value' | 'onChange' | 'onApply'>) {
  return useMemo<ParsedTaskSuggestion>(() => {
    const text = inputText.trim().toLowerCase()
    if (!text) {
      return {
        intent: null,
        templateId: null,
        entityType: null,
        entityId: null,
        entityLabel: null,
        assigneeId: null,
        assigneeName: null,
        priority: null,
        dueDate: null,
        chips: [],
      }
    }

    const chips: string[] = []

    let intent: WizardIntent = 'other'
    if (includesWord(text, 'verify') || includesWord(text, 'check')) {
      intent = 'verify'
      chips.push('Verify')
    } else if (includesWord(text, 'fix') || includesWord(text, 'update')) {
      intent = 'fix'
      chips.push('Fix')
    } else if (includesWord(text, 'task') || includesWord(text, 'follow up')) {
      intent = 'general'
      chips.push('General')
    }

    const matchedTemplate = context.templates.find((template) => {
      const name = template.name.toLowerCase()
      if (intent === 'verify') {
        return name.includes('verify') || name.includes('check')
      }
      if (intent === 'fix') {
        return name.includes('fix') || name.includes('update')
      }
      if (intent === 'general') {
        return template.scopeType === 'general'
      }
      return false
    }) ?? null

    if (matchedTemplate) {
      chips.push(matchedTemplate.name)
    }

    const matchedProduct = context.products.find((product) => text.includes(product.name.toLowerCase())) ?? null
    const matchedUser = context.users.find((user) => {
      const lowerName = user.name.toLowerCase()
      return text.includes(`assign ${lowerName}`) || text.includes(`for ${lowerName}`)
    }) ?? null

    let entityType: TaskScopeType | null = null
    let entityId: string | null = null
    let entityLabel: string | null = null

    if (matchedProduct) {
      entityType = 'product'
      entityId = matchedProduct.id
      entityLabel = matchedProduct.name
      chips.push(matchedProduct.name)
    } else if (includesWord(text, 'invoice')) {
      entityType = 'invoice'
      entityLabel = 'Invoice'
      chips.push('Invoice')
    } else if (includesWord(text, 'user')) {
      entityType = 'user'
      entityLabel = 'User'
      chips.push('User')
    } else if (intent === 'general') {
      entityType = 'general'
    }

    let dueDate: string | null = null
    if (includesWord(text, 'today')) {
      dueDate = toDateInputValue(new Date())
      chips.push('Today')
    } else if (includesWord(text, 'tomorrow')) {
      dueDate = toDateInputValue(addDays(new Date(), 1))
      chips.push('Tomorrow')
    } else if (includesWord(text, 'next week')) {
      dueDate = toDateInputValue(addDays(new Date(), 7))
      chips.push('Next week')
    }

    let assigneeId: string | null = null
    let assigneeName: string | null = null
    if (includesWord(text, 'assign me') || includesWord(text, 'assign to me') || includesWord(text, ' me')) {
      assigneeId = context.currentUserId
      assigneeName = context.currentUserName
      chips.push('Assign me')
    } else if (matchedUser) {
      assigneeId = matchedUser.id
      assigneeName = matchedUser.name
      chips.push(matchedUser.name)
    }

    let priority: TaskPriority | null = null
    if (includesWord(text, 'urgent') || includesWord(text, 'high priority')) {
      priority = 'high'
      chips.push('High')
    } else if (includesWord(text, 'low priority') || includesWord(text, 'low')) {
      priority = 'low'
      chips.push('Low')
    } else if (includesWord(text, 'medium')) {
      priority = 'medium'
      chips.push('Medium')
    }

    return {
      intent,
      templateId: matchedTemplate?.id ?? null,
      entityType,
      entityId,
      entityLabel,
      assigneeId,
      assigneeName,
      priority,
      dueDate,
      chips,
    }
  }, [context.currentUserId, context.currentUserName, context.products, context.templates, context.users, inputText])
}

export function TaskTypableInput(props: TaskTypableInputProps) {
  const parsed = useTaskParser(props.value, {
    templates: props.templates,
    users: props.users,
    products: props.products,
    currentUserId: props.currentUserId,
    currentUserName: props.currentUserName,
  })

  return (
    <div className="space-y-3 rounded-md border border-border/70 bg-muted/10 p-4">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="size-3.5" />
          Typables
        </div>
        <p className="text-sm font-medium text-foreground">Type what you want to do</p>
        <p className="text-xs text-muted-foreground">Example: `verify price for polo tomorrow assign me`</p>
      </div>

      <Input value={props.value} onChange={(event) => props.onChange(event.target.value)} placeholder="Type what you want to do..." />

      {parsed.chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {parsed.chips.map((chip) => <StatusBadge key={chip} tone="manual">{chip}</StatusBadge>)}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No structured suggestion yet. You can still continue with the normal wizard.</p>
      )}

      {parsed.chips.length > 0 ? (
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Detected:
            {parsed.templateId ? ' template' : ''}
            {parsed.entityLabel ? ' entity' : ''}
            {parsed.dueDate ? ' due date' : ''}
            {parsed.assigneeId ? ' assignee' : ''}
          </div>
          <Button type="button" size="sm" onClick={() => props.onApply(parsed)}>
            Continue
          </Button>
        </div>
      ) : null}
    </div>
  )
}
