import { z } from 'zod'

import { queryParamsSchema, type BaseFilters } from './query-params'

export const muscleGroupSchema = z.object({
  id: z.uuid(),
  nameEs: z.string(),
  nameEn: z.string().nullable(),
  slug: z.string(),
  nanoId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  exerciseCount: z.number().optional(),
})

export const createMuscleGroupSchema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().min(1),
})

export const updateMuscleGroupSchema = createMuscleGroupSchema.extend({})

export const muscleGroupSortSchema = z.enum(['name', 'createdAt'])

export const muscleGroupQueryParamsSchema = queryParamsSchema.extend({
  sort: muscleGroupSortSchema.default('createdAt'),
})

export type MuscleGroup = z.infer<typeof muscleGroupSchema>
export type CreateMuscleGroup = z.infer<typeof createMuscleGroupSchema>
export type UpdateMuscleGroup = z.infer<typeof updateMuscleGroupSchema>
export type MuscleGroupQueryParams = z.infer<typeof muscleGroupQueryParamsSchema>
export type MuscleGroupSortOptions = z.infer<typeof muscleGroupSortSchema>

export type MuscleGroupFilters = BaseFilters & {
  sort: MuscleGroupSortOptions
}
