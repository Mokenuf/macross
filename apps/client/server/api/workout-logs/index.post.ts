import type { WorkoutLog } from '@macross/shared'
import { createWorkoutLogSchema, workoutLogSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

const UNIQUE_VIOLATION = '23505'
const RLS_VIOLATION = '42501'

export default defineEventHandler(async (event): Promise<WorkoutLog> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const body = await readValidatedBody(event, createWorkoutLogSchema.parse)

  const client = await serverSupabaseClient(event)

  const logValues = {
    weight_kg: body.weightKg ?? null,
    actual_reps: body.actualReps ?? null,
    completed: body.completed,
    logged_at: new Date().toISOString(),
  }

  async function updateExisting() {
    return client
      .from('workout_logs')
      .update(logValues)
      .eq('routine_exercise_scheme_id', body.routineExerciseSchemeId)
      .eq('set_number', body.setNumber)
      .is('deleted_at', null)
      .select(workoutLogColumns)
      .maybeSingle()
  }

  const { data: updated, error: updateError } = await updateExisting()

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo guardar la serie' })
  }

  if (updated) return workoutLogSchema.parse(toCamelCase<WorkoutLog>(updated))

  const { data: inserted, error: insertError } = await client
    .from('workout_logs')
    .insert({
      routine_exercise_scheme_id: body.routineExerciseSchemeId,
      client_id: user.sub,
      set_number: body.setNumber,
      ...logValues,
    })
    .select(workoutLogColumns)
    .single()

  // Doble tap sobre una serie sin registro: los dos insertan y el índice único corta al segundo.
  if (insertError?.code === UNIQUE_VIOLATION) {
    const { data: retried, error: retryError } = await updateExisting()
    if (retryError || !retried) {
      throw createError({ statusCode: 500, statusMessage: 'No se pudo guardar la serie' })
    }
    return workoutLogSchema.parse(toCamelCase<WorkoutLog>(retried))
  }

  // La RLS corta cuando el scheme no es de una rutina del cliente o su cuenta está desactivada.
  if (insertError?.code === RLS_VIOLATION) {
    throw createError({ statusCode: 403, statusMessage: 'No podés registrar en esta serie' })
  }

  if (insertError || !inserted) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo registrar la serie' })
  }

  return workoutLogSchema.parse(toCamelCase<WorkoutLog>(inserted))
})
