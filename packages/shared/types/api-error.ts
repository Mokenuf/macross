import { z } from 'zod'

export const apiErrorSchema = z.object({
  statusCode: z.number(),
  statusMessage: z.string(),
})

export type ApiError = z.infer<typeof apiErrorSchema>
