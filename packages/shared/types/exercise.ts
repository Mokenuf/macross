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

export const createExerciseSchema = exerciseSchema
  .omit({
    id: true,
    trainerId: true,
    slug: true,
    nanoId: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  })
  .extend({
    name: z.string().min(1, 'El nombre es requerido'),
  })

export const updateExerciseSchema = exerciseSchema.partial().required({ id: true })

export const exerciseQueryParamsSchema = queryParamsSchema.extend({
  sort: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  muscleGroup: z.string().optional(),
})

export type Exercise = z.infer<typeof exerciseSchema>
export type CreateExercise = z.infer<typeof createExerciseSchema>
export type UpdateExercise = z.infer<typeof updateExerciseSchema>
export type ExerciseQueryParams = z.infer<typeof exerciseQueryParamsSchema>
