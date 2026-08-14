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

export type WorkoutLog = z.infer<typeof workoutLogSchema>
export type CreateWorkoutLog = z.infer<typeof createWorkoutLogSchema>
