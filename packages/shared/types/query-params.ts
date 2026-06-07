import { z } from 'zod'

import type { OrderOptions } from './enums'

export const queryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
})

export type QueryParams = z.infer<typeof queryParamsSchema>

export type BaseFilters = {
  page: number
  limit: number
  order: OrderOptions
  search: string
}
