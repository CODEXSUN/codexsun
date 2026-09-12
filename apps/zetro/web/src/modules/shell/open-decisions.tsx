import { useEffect, useState } from 'react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import type { ChatDecisionItem } from '@codexsun/zetro-contracts'
import { fetchTurnDecisions, saveTurnDecision } from './chat.services'

type AnswerKind = 'yes' | 'no' | 'custom'
type Choice = { answerKind: AnswerKind; answerText?: string; label: string }
type Question = { index: number; text: string }

export function OpenDecisions({
  conversationId,
  disabled,
  onConfirm,
  result,
  turnId,
}: {
  conversationId: string
  disabled: boolean
  onConfirm(summary: string): void
  result: string
  turnId: string
}) {
  const questions = extractOpenDecisions(result)
  const [decisions, setDecisions] = useState<ChatDecisionItem[]>([])
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [otherOpen, setOtherOpen] = useState<Record<number, boolean>>({})
  const [error, setError] = useState<string>()
  useEffect(() => { if (questions.length) void fetchTurnDecisions(conversationId, turnId).then(setDecisions).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load decisions.')) }, [conversationId, turnId, questions.length])
  if (!questions.length) return null
  async function save(question: Question, choice: Choice) {
    try {
      const answerText = choice.answerText ?? (choice.answerKind === 'custom' ? drafts[question.index]?.trim() : undefined)
      if (choice.answerKind === 'custom' && !answerText) return
      const saved = await saveTurnDecision(conversationId, turnId, { answerKind: choice.answerKind, answerText, question: question.text, questionIndex: question.index })
      setDecisions((current) => [...current.filter((item) => item.questionIndex !== saved.questionIndex), saved])
      setOtherOpen((current) => ({ ...current, [question.index]: false }))
      setError(undefined)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save the decision.') }
  }
  const confirmed = questions.map((question) => ({ question, decision: decisions.find((item) => item.questionIndex === question.index) })).filter((item): item is { question: Question; decision: ChatDecisionItem } => Boolean(item.decision))
  return <section className="space-y-3 rounded-lg border bg-muted/20 p-4" aria-label="Open decisions">
    <div><h3 className="text-sm font-semibold">Open decisions</h3><p className="text-xs text-muted-foreground">Choose an answer here. Every saved answer enters the Working Set as a decision.</p></div>
    {questions.map((question) => {
      const selected = decisions.find((item) => item.questionIndex === question.index)
      const choices = choicesFor(question.text)
      return <article className="grid gap-2 border-t pt-3 first:border-t-0 first:pt-0 xl:grid-cols-[minmax(18rem,1fr)_auto] xl:items-center" key={question.index}>
        <p className="text-sm leading-6">{question.index + 1}. {question.text}</p>
        <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
          {choices.map((choice) => <Button disabled={disabled} key={choice.label} onClick={() => void save(question, choice)} size="sm" type="button" variant={isSelected(selected, choice) ? 'default' : 'outline'}>{choice.label}</Button>)}
          <Button disabled={disabled} onClick={() => setOtherOpen((current) => ({ ...current, [question.index]: !current[question.index] }))} size="sm" type="button" variant="ghost">Other</Button>
          {otherOpen[question.index] ? <><Input aria-label={`Your choice for question ${question.index + 1}`} className="min-w-44 flex-1 xl:w-52 xl:flex-none" onChange={(event) => setDrafts((current) => ({ ...current, [question.index]: event.target.value }))} placeholder="Your choice" value={drafts[question.index] ?? (selected?.answerKind === 'custom' ? selected.answerText ?? '' : '')} /><Button className="shrink-0" disabled={disabled} onClick={() => void save(question, { answerKind: 'custom', label: 'Other' })} size="sm" type="button" variant="outline">Save</Button></> : null}
        </div>
      </article>
    })}
    {confirmed.length ? <div className="flex items-center justify-between gap-3 border-t pt-3"><p className="text-xs text-muted-foreground">{confirmed.length} confirmed choice{confirmed.length === 1 ? '' : 's'} will guide the next response.</p><Button disabled={disabled} onClick={() => onConfirm(formatConfirmation(confirmed))} size="sm" type="button">Confirm choices & regenerate</Button></div> : null}
    {error ? <p className="text-xs text-destructive">{error}</p> : null}
  </section>
}

function choicesFor(question: string): Choice[] {
  const alternatives = question.match(/\b(?:be|as)\s+(.+?),?\s+or\s+(.+?)\?$/i)
  if (alternatives) return alternatives.slice(1).map((value) => ({ answerKind: 'custom', answerText: value, label: shorten(value) }))
  return [{ answerKind: 'yes', label: 'Yes' }, { answerKind: 'no', label: 'No' }]
}

function shorten(value: string) { return value.replace(/^only\s+/i, '').replace(/^a\s+/i, '').replace(/^the\s+/i, '').slice(0, 42) }
function isSelected(decision: ChatDecisionItem | undefined, choice: Choice) { return decision?.answerKind === choice.answerKind && (choice.answerText ? decision.answerText === choice.answerText : !decision.answerText) }
function formatConfirmation(items: Array<{ decision: ChatDecisionItem; question: Question }>) { return `Regenerate the plan using these confirmed decisions. Do not repeat them as open questions:\n${items.map(({ decision, question }) => `- ${question.text}\n  Answer: ${decision.answerText ?? decision.answerKind}`).join('\n')}` }

function extractOpenDecisions(markdown: string): Question[] {
  const heading = markdown.match(/(?:^|\n)(?:#{1,6}\s*|\*\*)open decisions\*?\*?\s*\n([\s\S]*?)(?=\n(?:#{1,6}\s|\*\*[^*]+\*\*)|$)/i)
  if (!heading) return []
  return [...heading[1].matchAll(/(?:^|\n)\s*\d+[.)]\s+(.+?)(?=\n\s*\d+[.)]\s|\n\n|$)/g)].slice(0, 12).map((match, index) => ({ index, text: match[1].trim() })).filter((question) => question.text.endsWith('?'))
}
