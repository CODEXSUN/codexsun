import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@codexsun/ui/components/collapsible'
import {
  Brain,
  ChevronRight,
  FilePenLine,
  Globe,
  Send,
  Terminal,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

type ActivityEntry = {
  id: number
  item: Record<string, unknown>
  method: string
  type: 'activity'
}

type ResponseEntry = {
  content: string
  id: number
  type: 'response'
}

export type TurnEntry = ActivityEntry | ResponseEntry

type ActivityKind = 'command' | 'compaction' | 'file' | 'reasoning' | 'request' | 'tool' | 'web'

type ActivityGroup = {
  activities: ActivityEntry[]
  id: number
  kind: ActivityKind
  type: 'activity-group'
}

type TimelineEntry = ActivityGroup | ResponseEntry

export function ChatTurnTimeline({
  entries,
  isWorking,
}: {
  entries: TurnEntry[]
  isWorking: boolean
}) {
  const timeline = groupTimeline(entries)
  const lastActivityGroupId = [...timeline]
    .reverse()
    .find((entry) => entry.type === 'activity-group')?.id

  return (
    <div className="space-y-4">
      {timeline.map((entry) =>
        entry.type === 'response' ? (
          <pre
            className="whitespace-pre-wrap font-sans text-sm leading-6 text-foreground"
            key={entry.id}
          >
            {entry.content}
          </pre>
        ) : (
          <ActivityDisclosure
            active={isWorking && entry.id === lastActivityGroupId}
            group={entry}
            key={entry.id}
          />
        ),
      )}
    </div>
  )
}

function ActivityDisclosure({ active, group }: { active: boolean; group: ActivityGroup }) {
  const Icon = activityIcons[group.kind]
  const title = activityTitle(group, active)

  return (
    <Collapsible className="group/activity">
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 text-left text-sm text-muted-foreground hover:text-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span className={active ? 'zetro-shimmer-text' : undefined}>{title}</span>
        <ChevronRight className="size-3.5 shrink-0 transition-transform group-data-open/activity:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-5 pt-2">
        <div className="space-y-3 border-l pl-3 font-mono text-xs leading-5">
          {group.activities.map((activity) => (
            <div key={activity.id}>
              <div className="text-muted-foreground">{activity.method}</div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words pt-1 text-foreground">
                {JSON.stringify(activity.item, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

const activityIcons: Record<ActivityKind, LucideIcon> = {
  command: Terminal,
  compaction: Brain,
  file: FilePenLine,
  reasoning: Brain,
  request: Send,
  tool: Wrench,
  web: Globe,
}

function groupTimeline(entries: TurnEntry[]) {
  const timeline: TimelineEntry[] = []
  for (const entry of entries) {
    if (entry.type === 'response') {
      timeline.push(entry)
      continue
    }

    const kind = activityKind(entry)
    const previous = timeline.at(-1)
    if (previous?.type === 'activity-group' && previous.kind === kind) {
      previous.activities.push(entry)
      continue
    }
    timeline.push({ activities: [entry], id: entry.id, kind, type: 'activity-group' })
  }
  return timeline
}

function activityKind(activity: ActivityEntry): ActivityKind {
  const itemType = typeof activity.item.type === 'string' ? activity.item.type : ''
  if (itemType === 'commandExecution') return 'command'
  if (itemType === 'reasoning') return 'reasoning'
  if (itemType === 'userMessage' || activity.method === 'request') return 'request'
  if (/search/i.test(itemType)) return 'web'
  if (/file|patch/i.test(itemType)) return 'file'
  if (/compact/i.test(itemType)) return 'compaction'
  return 'tool'
}

function activityTitle(group: ActivityGroup, active: boolean) {
  const itemCount = uniqueItemCount(group.activities)
  if (group.kind === 'command')
    return active ? 'Running commands' : countLabel('Ran command', itemCount)
  if (group.kind === 'reasoning') return active ? 'Reasoning' : 'Reasoned'
  if (group.kind === 'request') return active ? 'Sending raw request' : 'Sent raw request'
  if (group.kind === 'web') return active ? 'Searching the web' : 'Searched the web'
  if (group.kind === 'file') return active ? 'Editing files' : 'Edited files'
  if (group.kind === 'compaction') return 'Context automatically compacted'
  return active ? 'Using tools' : countLabel('Used tool', itemCount)
}

function uniqueItemCount(activities: ActivityEntry[]) {
  const ids = activities
    .map(({ item }) => item.id)
    .filter((id): id is string => typeof id === 'string')
  return new Set(ids).size || activities.length
}

function countLabel(singular: string, count: number) {
  return count === 1 ? singular : `${singular}s (${count})`
}
