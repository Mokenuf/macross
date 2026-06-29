import { z } from 'zod'

import { queryParamsSchema, type BaseFilters } from './query-params'

export const equipmentSchema = z.object({
  id: z.uuid(),
  nameEs: z.string(),
  nameEn: z.string().nullable(),
  slug: z.string(),
  nanoId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export const createEquipmentSchema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().min(1),
})

export const updateEquipmentSchema = createEquipmentSchema.extend({})

export const equipmentSortSchema = z.enum(['name', 'createdAt'])

export const equipmentQueryParamsSchema = queryParamsSchema.extend({
  sort: equipmentSortSchema.default('createdAt'),
})

export type Equipment = z.infer<typeof equipmentSchema>
export type CreateEquipment = z.infer<typeof createEquipmentSchema>
export type UpdateEquipment = z.infer<typeof updateEquipmentSchema>
export type EquipmentQueryParams = z.infer<typeof equipmentQueryParamsSchema>
export type EquipmentSortOptions = z.infer<typeof equipmentSortSchema>

export type EquipmentFilters = BaseFilters & {
  sort: EquipmentSortOptions
}
