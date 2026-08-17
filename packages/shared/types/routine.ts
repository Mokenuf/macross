import { z } from 'zod'

import { blockTypeEnum } from './enums'
import { equipmentSchema } from './equipment'
import { queryParamsSchema, type BaseFilters } from './query-params'
import { workoutLogSchema } from './workout-log'

export const routineExerciseSchemeSchema = z.object({
  id: z.uuid(),
  routineExerciseId: z.uuid(),
  weekNumber: z.number().int(),
  sets: z.number().int(),
  reps: z.string(),
  restSeconds: z.number().int().nullable(),
  notes: z.string().nullable(),
  // Dos consumidores, dos shapes: la PWA necesita las filas (peso y reps por serie); el builder del
  // trainer solo el conteo, para bloquear la celda ya entrenada. El read del trainer sirve el
  // conteo en vez de los logs, así el candado no depende de cuántos logs embeba el endpoint.
  logs: z.array(workoutLogSchema).optional(),
  trainedSets: z.number().int().optional(),
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
  exercise: z.object({
    id: z.uuid(),
    nameEs: z.string(),
    nameEn: z.string().nullable(),
    videoUrl: z.url().nullable(),
    slug: z.string(),
    nanoId: z.string(),
    equipment: equipmentSchema.nullable(),
  }),
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
  // Derivado, solo en el detalle: la primera semana sin cerrar. Es desde donde el PATCH aplica los
  // cambios, y lo que el wizard avisa antes de dejar editar una fase ya empezada.
  startWeek: z.number().int().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
})

// Una semana ausente NO es un dato faltante: significa que el ejercicio no se prescribe esa semana
// (el read ya lo modela así, `schemeForWeek` devuelve null y la PWA no lo dibuja). Por eso el array
// es rango abierto y no una tupla de 4.
export const createRoutineSchemeSchema = z.object({
  weekNumber: z.coerce.number().int().min(1),
  sets: z.coerce.number().int().min(1),
  reps: z.string().min(1),
  restSeconds: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().optional(),
})

// El scheme no lleva id: `(slot, weekNumber)` ya lo identifica (índice único en la DB), así que el
// server lo resuelve por semana.
export const createRoutineExerciseSchema = z.object({
  exerciseId: z.uuid(),
  optional: z.boolean().optional().default(false),
  notes: z.string().optional(),
  schemes: z.array(createRoutineSchemeSchema).min(1),
})

export const createRoutineBlockSchema = z.object({
  type: blockTypeEnum.optional().default('single'),
  notes: z.string().optional(),
  exercises: z.array(createRoutineExerciseSchema).min(1),
})

export const createRoutineDaySchema = z.object({
  label: z.string().optional(),
  blocks: z.array(createRoutineBlockSchema).default([]),
})

export const createRoutineSchema = z.object({
  name: z.string().min(1),
  clientId: z.preprocess(val => (val === '' ? undefined : val), z.uuid().optional()),
  daysPerWeek: z.coerce.number().int().min(1).max(7),
  weeks: z.coerce.number().int().min(1).default(4),
  notes: z.string().optional(),
  isTemplate: z.boolean().optional().default(false),
  // Activar desactiva las demás del cliente (una activa por cliente). Desactivar no es terminal.
  activate: z.boolean().optional().default(false),
  days: z.array(createRoutineDaySchema).min(1),
})

// Los ids dejan que el PATCH empareje filas vivas en vez de reemplazar el árbol (así los
// workout_logs siguen colgando de schemes vivas); ausente = fila nueva.
export const updateRoutineExerciseSchema = createRoutineExerciseSchema.extend({
  id: z.uuid().optional(),
})

// Un slot puede venir con id dentro de un bloque distinto al que tenía: agrupar dos ejercicios ya
// entrenados es re-apuntar el slot, no retirarlo (retirarlo le borraría el progreso al cliente).
export const updateRoutineBlockSchema = createRoutineBlockSchema.extend({
  id: z.uuid().optional(),
  exercises: z.array(updateRoutineExerciseSchema).min(1),
})

export const updateRoutineDaySchema = createRoutineDaySchema.extend({
  id: z.uuid().optional(),
  blocks: z.array(updateRoutineBlockSchema).default([]),
})

export const updateRoutineSchema = createRoutineSchema.extend({
  days: z.array(updateRoutineDaySchema).min(1),
})

export const routineStatusSchema = z.enum(['all', 'active', 'inactive']).default('active')

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

export type CreateRoutineScheme = z.infer<typeof createRoutineSchemeSchema>
export type CreateRoutineExercise = z.infer<typeof createRoutineExerciseSchema>
export type CreateRoutineBlock = z.infer<typeof createRoutineBlockSchema>
export type CreateRoutineDay = z.infer<typeof createRoutineDaySchema>
export type CreateRoutine = z.infer<typeof createRoutineSchema>

export type UpdateRoutineExercise = z.infer<typeof updateRoutineExerciseSchema>
export type UpdateRoutineBlock = z.infer<typeof updateRoutineBlockSchema>
export type UpdateRoutineDay = z.infer<typeof updateRoutineDaySchema>
export type UpdateRoutine = z.infer<typeof updateRoutineSchema>

export type RoutineStatus = z.infer<typeof routineStatusSchema>
export type RoutineSortOptions = z.infer<typeof routineSortSchema>
export type RoutineQueryParams = z.infer<typeof routineQueryParamsSchema>

export type RoutineFilters = BaseFilters & {
  clientId: string | ''
  status: RoutineStatus
  sort: RoutineSortOptions
}
