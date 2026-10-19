import { z } from 'zod'

import { unitKindEnum } from './enums'
import { queryParamsSchema, type BaseFilters } from './query-params'

export const unitSchema = z.object({
  id: z.uuid(),
  nameEs: z.string(),
  nameEn: z.string().nullable(),
  slug: z.string(),
  nanoId: z.string(),
  kind: unitKindEnum,
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  exerciseCount: z.number().optional(),
})

export const unitRefSchema = unitSchema.pick({ id: true, nameEs: true, nameEn: true, kind: true })

// La default se cambia marcando otra: `false` no desmarca la vigente.
export const createUnitSchema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().min(1),
  kind: unitKindEnum,
  isDefault: z.boolean().optional().default(false),
})

export const updateUnitSchema = createUnitSchema.extend({})

export const unitSortSchema = z.enum(['name', 'createdAt'])

export const unitQueryParamsSchema = queryParamsSchema.extend({
  sort: unitSortSchema.default('createdAt'),
})

export type Unit = z.infer<typeof unitSchema>
export type UnitRef = z.infer<typeof unitRefSchema>
export type CreateUnit = z.infer<typeof createUnitSchema>
export type UpdateUnit = z.infer<typeof updateUnitSchema>
export type UnitQueryParams = z.infer<typeof unitQueryParamsSchema>
export type UnitSortOptions = z.infer<typeof unitSortSchema>

export type UnitFilters = BaseFilters & {
  sort: UnitSortOptions
}
