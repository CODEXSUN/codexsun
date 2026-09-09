import { Bot, Check, ChevronDown } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@codexsun/ui/components/dropdown-menu'
import {
  getCodexModelLabel,
  useZetroPreferences,
  zetroCodexModels,
  zetroReasoningLevels,
} from '../settings'

export function CodexModelSelector({ disabled }: { disabled: boolean }) {
  const { preferences, setPreference } = useZetroPreferences()
  const modelLabel = getCodexModelLabel(preferences.codexModel)
  const triggerLabel = preferences.codexModel === 'default' ? 'Codex' : modelLabel
  const reasoningLabel =
    zetroReasoningLevels.find(({ value }) => value === preferences.reasoningLevel)?.label ??
    'Medium'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={`Codex model ${modelLabel}, ${reasoningLabel} reasoning`}
            className="h-7 min-w-0 gap-1.5 px-2 text-xs"
            disabled={disabled}
            size="sm"
            variant="ghost"
          />
        }
      >
        <Bot className="size-3.5 text-muted-foreground" />
        <span className="max-w-36 truncate font-medium">{triggerLabel}</span>
        <span className="text-muted-foreground">{reasoningLabel}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-72" sideOffset={6}>
        <DropdownMenuLabel>Codex model</DropdownMenuLabel>
        {zetroCodexModels.map((model) => (
          <DropdownMenuItem
            className="items-start py-2"
            key={model.value}
            onClick={() => setPreference('codexModel', model.value)}
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium">{model.label}</span>
              <span className="text-xs text-muted-foreground">{model.description}</span>
            </span>
            {preferences.codexModel === model.value ? <Check className="mt-0.5 size-3.5" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Reasoning</DropdownMenuLabel>
        {zetroReasoningLevels.map((level) => (
          <DropdownMenuItem
            className="py-2"
            key={level.value}
            onClick={() => setPreference('reasoningLevel', level.value)}
          >
            <span className="flex min-w-0 flex-1 items-baseline gap-2">
              <span className="font-medium">{level.label}</span>
              <span className="text-xs text-muted-foreground">{level.description}</span>
            </span>
            {preferences.reasoningLevel === level.value ? <Check className="size-3.5" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
