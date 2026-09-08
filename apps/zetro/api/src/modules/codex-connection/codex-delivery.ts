import { z } from 'zod'
import type { CodexDeliveryRun, CodexDeliveryStageId } from './codex-connection.types.js'

export const deliveryStageIds = [
  'plan',
  'observe',
  'review',
  'assign',
  'implement',
  'verify',
  'document',
  'version',
  'publish',
] as const

const deliveryOutputSchema = z.strictObject({
  answer: z.string().trim().min(1),
  stages: z
    .array(
      z.strictObject({
        evidence: z.string().trim().min(1).max(1_000),
        id: z.enum(deliveryStageIds),
        status: z.enum(['blocked', 'complete', 'ready', 'skipped']),
      }),
    )
    .length(deliveryStageIds.length),
})

export const deliveryOutputJsonSchema = {
  additionalProperties: false,
  properties: {
    answer: { minLength: 1, type: 'string' },
    stages: {
      items: {
        additionalProperties: false,
        properties: {
          evidence: { maxLength: 1_000, minLength: 1, type: 'string' },
          id: { enum: deliveryStageIds, type: 'string' },
          status: { enum: ['blocked', 'complete', 'ready', 'skipped'], type: 'string' },
        },
        required: ['id', 'status', 'evidence'],
        type: 'object',
      },
      maxItems: deliveryStageIds.length,
      minItems: deliveryStageIds.length,
      type: 'array',
    },
  },
  required: ['answer', 'stages'],
  type: 'object',
} as const

export function parseDeliveryOutput(
  value: string,
  updatedAt = new Date().toISOString(),
): {
  content: string
  delivery: CodexDeliveryRun
} {
  const output = deliveryOutputSchema.parse(JSON.parse(value) as unknown)
  validateStageOrder(output.stages.map((stage) => stage.id))
  const stages = output.stages.map((stage) => ({ ...stage, updatedAt }))
  const publish = stages.at(-1)!
  const preparationComplete = stages
    .slice(0, -1)
    .every((stage) => stage.status === 'complete' || stage.status === 'skipped')

  return {
    content: output.answer,
    delivery: {
      publicationReady:
        preparationComplete && (publish.status === 'ready' || publish.status === 'complete'),
      stages,
    },
  }
}

function validateStageOrder(ids: readonly CodexDeliveryStageId[]): void {
  if (!ids.every((id, index) => id === deliveryStageIds[index])) {
    throw new Error('Codex returned delivery stages in an invalid order.')
  }
}
