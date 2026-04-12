import { z } from 'zod'

import { queryParamsSchema } from './query-params'

export const muscleGroupSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  nanoId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export const createMuscleGroupSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
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
