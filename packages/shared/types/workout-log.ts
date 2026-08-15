import { z } from 'zod'

export const workoutLogSchema = z.object({
  id: z.uuid(),
  routineExerciseSchemeId: z.uuid(),
  setNumber: z.number().int(),
  weightKg: z.number().nullable(),
  actualReps: z.number().int().nullable(),
  completed: z.boolean(),
  loggedAt: z.string().nullable(),
})

// La identidad de un log es (scheme, serie): re-tocar una serie corrige su fila, no crea otra,
// y desmarcar es `completed: false` por el mismo endpoint — no hay delete.
export const createWorkoutLogSchema = z.object({
  routineExerciseSchemeId: z.uuid(),
  setNumber: z.coerce.number().int().min(1).max(20),
  weightKg: z.coerce.number().nonnegative().max(9999.99).optional(),
  actualReps: z.coerce.number().int().nonnegative().max(999).optional(),
  completed: z.boolean().optional().default(true),
})

// La sesión en curso la identifica el front, y son tres campos y no el scheme: editar una fase retira
// el slot y crea otro, así que una misma sesión puede tener varios schemes (los viejos, fantasmas).
export const lastWorkoutQueryParamsSchema = z.object({
  exerciseId: z.uuid(),
  routineId: z.uuid(),
  dayNumber: z.coerce.number().int().min(1).max(7),
  weekNumber: z.coerce.number().int().min(1).max(52),
})

export type WorkoutLog = z.infer<typeof workoutLogSchema>
export type CreateWorkoutLog = z.infer<typeof createWorkoutLogSchema>
export type LastWorkoutQueryParams = z.infer<typeof lastWorkoutQueryParamsSchema>
