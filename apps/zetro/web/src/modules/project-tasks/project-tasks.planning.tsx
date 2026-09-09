import { useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { CheckCircle2, ListTree, ScanSearch } from 'lucide-react'
import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@codexsun/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@codexsun/ui/components/dropdown-menu'
import { useProjectTasks } from './project-tasks.controller'
import type { ZetroTask } from './project-tasks.types'

export function TaskPlanningActions({ task }: { task: ZetroTask }) {
  const tasks = useProjectTasks()
  const [reviewOpen, setReviewOpen] = useState(false)
  const scorecard = useMemo(() => scoreTask(task, tasks.childTasks), [task, tasks.childTasks])

  async function reviewTask() {
    await tasks.bindReviewWorkflow(task.id)
    setReviewOpen(true)
  }

  return (
    <>
      <PlanningMenu icon={ScanSearch} label="Review task">
        <DropdownMenuItem onClick={() => void reviewTask()}>Run review workflow</DropdownMenuItem>
      </PlanningMenu>
      <PlanningMenu icon={ListTree} label="Split task">
        <DropdownMenuItem onClick={() => void tasks.splitTask(task, 'phase')}>
          Split into phases
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void tasks.splitTask(task, 'subtask')}>
          Split into subtasks
        </DropdownMenuItem>
      </PlanningMenu>
      <TaskScorecard
        onOpenChange={setReviewOpen}
        open={reviewOpen}
        scorecard={scorecard}
        task={task}
      />
    </>
  )
}

function TaskScorecard({
  onOpenChange,
  open,
  scorecard,
  task,
}: {
  onOpenChange(open: boolean): void
  open: boolean
  scorecard: TaskScorecard
  task: ZetroTask
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Task review scorecard</DialogTitle>
          <DialogDescription>
            Review is now the saved workflow binding for “{task.title}”. It is a non-editing
            assessment path; it does not start or publish work.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-end justify-between border-y py-4">
          <div>
            <p className="text-3xl font-semibold tracking-tight">{scorecard.score}/100</p>
            <p className="pt-1 text-sm text-muted-foreground">{scorecard.label}</p>
          </div>
          <Badge variant={scorecard.score >= 75 ? 'default' : 'outline'}>
            {task.workflow === 'review' ? 'Review bound' : 'Needs binding'}
          </Badge>
        </div>
        <ul className="grid gap-3" aria-label="Task readiness checks">
          {scorecard.checks.map((check) => (
            <li className="flex items-start gap-3" key={check.label}>
              <CheckCircle2
                className={
                  check.complete
                    ? 'mt-0.5 size-4 text-foreground'
                    : 'mt-0.5 size-4 text-muted-foreground'
                }
              />
              <div>
                <p className="font-medium">{check.label}</p>
                <p className="text-sm text-muted-foreground">{check.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

function PlanningMenu({
  children,
  icon: Icon,
  label,
}: {
  children: ReactNode
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={label}
            className="cursor-pointer"
            size="icon-sm"
            title={label}
            variant="ghost"
          />
        }
      >
        <Icon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {children}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type TaskScorecard = {
  checks: Array<{ complete: boolean; detail: string; label: string }>
  label: string
  score: number
}

function scoreTask(task: ZetroTask, children: readonly ZetroTask[]): TaskScorecard {
  const hasDescription = task.description.trim().length >= 80
  const hasVerification = /acceptance|verify|test|done when|success/i.test(task.description)
  const hasPlan = children.some((child) => child.planningKind === 'phase')
  const hasSubtasks = children.some((child) => child.planningKind === 'subtask')
  const checks = [
    {
      complete: task.title.trim().length >= 8,
      detail: 'A specific title makes the intended outcome identifiable.',
      label: 'Clear outcome',
      points: 20,
    },
    {
      complete: hasDescription,
      detail: 'Add scope, constraints, and expected behavior to the description.',
      label: 'Enough context',
      points: 25,
    },
    {
      complete: hasVerification,
      detail: 'State how the result will be verified or accepted.',
      label: 'Verification defined',
      points: 20,
    },
    {
      complete: task.workflow === 'review',
      detail: 'Review is the non-editing workflow used to assess this task.',
      label: 'Workflow bound',
      points: 15,
    },
    {
      complete: hasPlan || hasSubtasks,
      detail: 'Generate phases or subtasks when the work needs a visible execution plan.',
      label: 'Execution plan',
      points: 20,
    },
  ]
  const score = checks.reduce((total, check) => total + (check.complete ? check.points : 0), 0)
  return {
    checks,
    label:
      score >= 80
        ? 'Ready for execution'
        : score >= 50
          ? 'Needs planning detail'
          : 'Needs definition',
    score,
  }
}
