import type { WorkoutLog } from '@macross/shared'
import { lastWorkoutQueryParamsSchema, workoutLogSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

const sessionSelect = `
  id,
  slot:routine_exercises!inner(
    exercise_id,
    block:routine_blocks!inner(
      day:routine_days!inner(day_number, routine_id)
    )
  )
`

const logSelect = `
  routine_exercise_scheme_id,
  scheme:routine_exercise_schemes!inner(
    slot:routine_exercises!inner(exercise_id)
  )
`

export default defineEventHandler(async (event): Promise<WorkoutLog | null> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const query = await getValidatedQuery(event, lastWorkoutQueryParamsSchema.parse)

  const client = await serverSupabaseClient(event)

  // Editar una fase retira el slot y crea otro, así que la sesión en curso puede tener varios schemes
  // del mismo (fase, día, semana). Todos son la sesión de hoy, ninguno es "la vez pasada".
  const { data: session, error: sessionError } = await client
    .from('routine_exercise_schemes')
    .select(sessionSelect)
    .eq('week_number', query.weekNumber)
    .eq('slot.exercise_id', query.exerciseId)
    .eq('slot.block.day.routine_id', query.routineId)
    .eq('slot.block.day.day_number', query.dayNumber)

  if (sessionError) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo cargar tu registro anterior' })
  }

  const currentSchemes = toCamelCase<{ id: string }[]>(session ?? []).map(scheme => scheme.id)

  // El histórico cuelga de slots y schemes retirados por una edición de fase, así que acá no se
  // filtra el deleted_at del árbol: hacerlo borraría la vez pasada de toda fase editada.
  let latestQuery = client
    .from('workout_logs')
    .select(logSelect)
    .eq('client_id', user.sub)
    .eq('scheme.slot.exercise_id', query.exerciseId)
    .eq('completed', true)
    .is('deleted_at', null)
    .order('logged_at', { ascending: false })
    .limit(1)

  if (currentSchemes.length) {
    latestQuery = latestQuery.not(
      'routine_exercise_scheme_id',
      'in',
      `(${currentSchemes.join(',')})`,
    )
  }

  const { data: latest, error: latestError } = await latestQuery.maybeSingle()

  if (latestError) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo cargar tu registro anterior' })
  }

  if (!latest) return null

  const { routineExerciseSchemeId } = toCamelCase<{ routineExerciseSchemeId: string }>(latest)

  const { data, error } = await client
    .from('workout_logs')
    .select(workoutLogColumns)
    .eq('routine_exercise_scheme_id', routineExerciseSchemeId)
    .eq('completed', true)
    .is('deleted_at', null)
    .not('weight_kg', 'is', null)
    .order('weight_kg', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo cargar tu registro anterior' })
  }

  if (!data) return null

  return workoutLogSchema.parse(toCamelCase<WorkoutLog>(data))
})
