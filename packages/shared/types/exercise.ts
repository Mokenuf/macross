import { z } from 'zod'

import { muscleGroupSchema } from './muscle-group'
import { queryParamsSchema, type BaseFilters } from './query-params'

export const exerciseSchema = z.object({
  id: z.uuid(),
  trainerId: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  videoUrl: z.url().nullable(),
  muscleGroups: z.array(muscleGroupSchema),
  slug: z.string(),
  nanoId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export const createExerciseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  videoUrl: z.preprocess(val => (val === '' ? undefined : val), z.url().optional()),
  muscleGroupIds: z.array(z.uuid()).optional().default([]),
})

export const updateExerciseSchema = createExerciseSchema.extend({})

export const exerciseWithPivotSchema = exerciseSchema.omit({ muscleGroups: true }).extend({
  exerciseMuscleGroups: z.array(
    z.object({
      muscleGroups: muscleGroupSchema,
    }),
  ),
})

export const exerciseSortSchema = z.enum(['name', 'createdAt'])

export const exerciseQueryParamsSchema = queryParamsSchema.extend({
  sort: exerciseSortSchema.default('createdAt'),
})

export type Exercise = z.infer<typeof exerciseSchema>
export type CreateExercise = z.infer<typeof createExerciseSchema>
export type UpdateExercise = z.infer<typeof updateExerciseSchema>
export type ExerciseWithPivot = z.infer<typeof exerciseWithPivotSchema>
export type ExerciseQueryParams = z.infer<typeof exerciseQueryParamsSchema>
export type ExerciseSortOptions = z.infer<typeof exerciseSortSchema>

export type ExerciseFilters = BaseFilters & {
  sort: ExerciseSortOptions
}
