import { z } from 'zod'

import { equipmentSchema } from './equipment'
import { muscleGroupSchema } from './muscle-group'
import { queryParamsSchema, type BaseFilters } from './query-params'

export const exerciseSchema = z.object({
  id: z.uuid(),
  trainerId: z.uuid(),
  nameEs: z.string(),
  nameEn: z.string().nullable(),
  descriptionEs: z.string().nullable(),
  descriptionEn: z.string().nullable(),
  videoUrl: z.url().nullable(),
  muscleGroups: z.array(muscleGroupSchema),
  equipment: equipmentSchema.nullable(),
  slug: z.string(),
  nanoId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export const createExerciseSchema = z.object({
  nameEs: z.string().min(1),
  nameEn: z.string().min(1),
  descriptionEs: z.string().optional(),
  descriptionEn: z.string().optional(),
  videoUrl: z.preprocess(val => (val === '' ? undefined : val), z.url().optional()),
  muscleGroupIds: z.array(z.uuid()).optional().default([]),
  equipmentId: z.uuid().optional(),
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

const idArrayParam = z.preprocess(
  val => (val === undefined || val === '' ? [] : Array.isArray(val) ? val : [val]),
  z.array(z.uuid()),
)

export const exerciseQueryParamsSchema = queryParamsSchema.extend({
  sort: exerciseSortSchema.default('createdAt'),
  equipmentIds: idArrayParam,
  muscleGroupIds: idArrayParam,
})

export type Exercise = z.infer<typeof exerciseSchema>
export type CreateExercise = z.infer<typeof createExerciseSchema>
export type UpdateExercise = z.infer<typeof updateExerciseSchema>
export type ExerciseWithPivot = z.infer<typeof exerciseWithPivotSchema>
export type ExerciseQueryParams = z.infer<typeof exerciseQueryParamsSchema>
export type ExerciseSortOptions = z.infer<typeof exerciseSortSchema>

export type ExerciseFilters = BaseFilters & {
  sort: ExerciseSortOptions
  equipmentIds: string[]
  muscleGroupIds: string[]
}
