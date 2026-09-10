import { ArrowUpRight, Search } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Badge } from '@codexsun/ui/components/badge'
import { Input } from '@codexsun/ui/components/input'
import { Spinner } from '@codexsun/ui/components/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@codexsun/ui/components/table'
import type { SystemTask } from '../system-tasks'
import { runDuration } from './automation.run-model'

export function AutomationRunList({
  tasks,
  search,
  onSearch,
  onSelect,
  live,
  animated,
}: {
  tasks: SystemTask[]
  search: string
  onSearch(value: string): void
  onSelect(id: string): void
  live: boolean
  animated: boolean
}) {
  const visible = tasks.filter((task) =>
    `${task.title} ${task.type} ${task.status}`.toLowerCase().includes(search.toLowerCase()),
  )
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{live ? 'Live runs' : 'Run history'}</h2>
          <p className="text-sm text-muted-foreground">
            {live
              ? 'Queued and active work. Open a run to follow its recorded progress.'
              : 'Completed, failed, blocked, and stopped runs. Open one for its report.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Search className="size-4" />
          <Input
            aria-label="Search runs"
            placeholder="Search runs or status"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14 pl-4">No.</TableHead>
            <TableHead>Run / owner</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Started</TableHead>
            <TableHead className="pr-4 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((task, index) => (
            <TableRow key={task.id}>
              <TableCell className="pl-4 tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="truncate font-medium" title={task.title}>
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground">{task.type}</p>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    ['failed', 'blocked'].includes(task.status) ? 'destructive' : 'secondary'
                  }
                >
                  {task.status === 'running' && (
                    <Spinner animated={animated} aria-label="Reported running" />
                  )}
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell className="tabular-nums">{runDuration(task)}</TableCell>
              <TableCell>
                {task.startedAt ? new Date(task.startedAt).toLocaleString() : 'Queued'}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(task.id)}
                  aria-label={`Open ${task.title}`}
                >
                  Open <ArrowUpRight />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!visible.length && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {search
            ? 'No runs match this search.'
            : live
              ? 'No active runs. Start a repository script or submit an approved supervisor job.'
              : 'No run history for this project yet.'}
        </p>
      )}
    </section>
  )
}
