import { z } from 'zod'

export const systemTaskParametersSchema = z.strictObject({ taskId: z.string().uuid() })
export const systemTaskListQuerySchema = z.strictObject({ projectId: z.string().uuid().optional() })
