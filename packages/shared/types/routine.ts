import { z } from 'zod'

import { blockTypeEnum } from './enums'
import { exerciseSchema } from './exercise'
import { queryParamsSchema, type BaseFilters } from './query-params'

export const routineExerciseSchemeSchema = z.object({
  id: z.uuid(),
  routineExerciseId: z.uuid(),
  weekNumber: z.number().int(),
  sets: z.number().int(),
  reps: z.string(),
  restSeconds: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const routineExerciseSchema = z.object({
  id: z.uuid(),
  routineBlockId: z.uuid(),
  exerciseId: z.uuid(),
  sortOrder: z.number().int(),
  optional: z.boolean(),
  notes: z.string().nullable(),
  exercise: exerciseSchema,
  schemes: z.array(routineExerciseSchemeSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export const routineBlockSchema = z.object({
  id: z.uuid(),
  routineDayId: z.uuid(),
  type: blockTypeEnum,
  sortOrder: z.number().int(),
  notes: z.string().nullable(),
  exercises: z.array(routineExerciseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export const routineDaySchema = z.object({
  id: z.uuid(),
  routineId: z.uuid(),
  dayNumber: z.number().int(),
  label: z.string().nullable(),
  nanoId: z.string(),
  blocks: z.array(routineBlockSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export const routineSchema = z.object({
  id: z.uuid(),
  trainerId: z.uuid(),
  clientId: z.uuid().nullable(),
  name: z.string(),
  daysPerWeek: z.number().int(),
  weeks: z.number().int(),
  notes: z.string().nullable(),
  active: z.boolean(),
  isTemplate: z.boolean(),
  nanoId: z.string(),
  client: z
    .object({ id: z.uuid(), fullName: z.string(), nanoId: z.string() })
    .nullable()
    .optional(),
  days: z.array(routineDaySchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

export const createRoutineExerciseSchema = z.object({
  exerciseId: z.uuid(),
  optional: z.boolean().optional().default(false),
  notes: z.string().optional(),
  sets: z.coerce.number().int().min(1),
  reps: z.string().min(1),
  restSeconds: z.string().optional(),
})

export const createRoutineDaySchema = z.object({
  label: z.string().optional(),
  exercises: z.array(createRoutineExerciseSchema).default([]),
})

export const createRoutineSchema = z.object({
  name: z.string().min(1),
  clientId: z.preprocess(val => (val === '' ? undefined : val), z.uuid().optional()),
  daysPerWeek: z.coerce.number().int().min(1).max(7),
  weeks: z.coerce.number().int().min(1).default(4),
  notes: z.string().optional(),
  isTemplate: z.boolean().optional().default(false),
  days: z.array(createRoutineDaySchema).min(1),
})

export const updateRoutineSchema = createRoutineSchema.extend({})

export const routineStatusSchema = z.enum(['all', 'active', 'finished']).default('active')

export const routineSortSchema = z.enum(['name', 'createdAt'])

export const routineQueryParamsSchema = queryParamsSchema.extend({
  sort: routineSortSchema.default('createdAt'),
  clientId: z.preprocess(val => (val === '' ? undefined : val), z.uuid().optional()),
  status: routineStatusSchema,
})

export type RoutineExerciseScheme = z.infer<typeof routineExerciseSchemeSchema>
export type RoutineExercise = z.infer<typeof routineExerciseSchema>
export type RoutineBlock = z.infer<typeof routineBlockSchema>
export type RoutineDay = z.infer<typeof routineDaySchema>
export type Routine = z.infer<typeof routineSchema>

export type CreateRoutineExercise = z.infer<typeof createRoutineExerciseSchema>
export type CreateRoutineDay = z.infer<typeof createRoutineDaySchema>
export type CreateRoutine = z.infer<typeof createRoutineSchema>
export type UpdateRoutine = z.infer<typeof updateRoutineSchema>

export type RoutineStatus = z.infer<typeof routineStatusSchema>
export type RoutineSortOptions = z.infer<typeof routineSortSchema>
export type RoutineQueryParams = z.infer<typeof routineQueryParamsSchema>

export type RoutineFilters = BaseFilters & {
  clientId: string | ''
  status: RoutineStatus
  sort: RoutineSortOptions
}
