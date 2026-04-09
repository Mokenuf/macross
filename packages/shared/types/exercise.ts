import { z } from 'zod'

import { queryParamsSchema } from './query-params'

export const exerciseSchema = z.object({
  id: z.uuid(),
  trainerId: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  videoUrl: z.url().nullable(),
  muscleGroup: z.string().nullable(), // TODO: enum or muscleGroup CRUDL
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
  muscleGroup: z.string().optional(),
})

export const updateExerciseSchema = createExerciseSchema.extend({})

export const exerciseSortSchema = z.enum(['name', 'createdAt', 'muscleGroup'])

export const exerciseQueryParamsSchema = queryParamsSchema.extend({
  sort: exerciseSortSchema.default('createdAt'),
  muscleGroup: z.string().optional(),
})

export type Exercise = z.infer<typeof exerciseSchema>
export type CreateExercise = z.infer<typeof createExerciseSchema>
export type UpdateExercise = z.infer<typeof updateExerciseSchema>
export type ExerciseQueryParams = z.infer<typeof exerciseQueryParamsSchema>
export type ExerciseSortOptions = z.infer<typeof exerciseSortSchema>
