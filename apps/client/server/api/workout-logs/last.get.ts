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
    week_number,
    slot:routine_exercises!inner(
      exercise_id,
      block:routine_blocks!inner(
        day:routine_days!inner(day_number, routine_id)
      )
    )
  )
`

const previousSessionSelect = `
  id,
  slot:routine_exercises!inner(
    sort_order,
    exercise_id,
    block:routine_blocks!inner(
      sort_order,
      day:routine_days!inner(day_number, routine_id)
    )
  ),
  logs:workout_logs!inner(id)
`

type LatestLog = {
  scheme: {
    weekNumber: number
    slot: { block: { day: { dayNumber: number; routineId: string } } }
  }
}

type SessionScheme = {
  id: string
  slot: { sortOrder: number; block: { sortOrder: number } }
}

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

  const { scheme: latestScheme } = toCamelCase<LatestLog>(latest)
  const previousDay = latestScheme.slot.block.day

  // El último log marca la sesión, no la fila: en un dropset el último registrado es el drop.
  const { data: previousSession, error: previousSessionError } = await client
    .from('routine_exercise_schemes')
    .select(previousSessionSelect)
    .eq('week_number', latestScheme.weekNumber)
    .eq('slot.exercise_id', query.exerciseId)
    .eq('slot.block.day.routine_id', previousDay.routineId)
    .eq('slot.block.day.day_number', previousDay.dayNumber)
    .eq('logs.completed', true)
    .is('logs.deleted_at', null)

  if (previousSessionError) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo cargar tu registro anterior' })
  }

  const previousScheme = toCamelCase<SessionScheme[]>(previousSession ?? []).toSorted(
    (a, b) =>
      a.slot.block.sortOrder - b.slot.block.sortOrder || a.slot.sortOrder - b.slot.sortOrder,
  )[query.occurrence]

  if (!previousScheme) return null

  const { data, error } = await client
    .from('workout_logs')
    .select(workoutLogColumns)
    .eq('routine_exercise_scheme_id', previousScheme.id)
    .eq('completed', true)
    .is('deleted_at', null)
    .or('weight_kg.not.is.null,actual_reps.not.is.null')
    // Con peso, la referencia es la serie más pesada; sin peso (peso corporal, tiempo), la de más
    // cantidad: más reps, más pasos o más segundos aguantados.
    .order('weight_kg', { ascending: false, nullsFirst: false })
    .order('actual_reps', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo cargar tu registro anterior' })
  }

  if (!data) return null

  return workoutLogSchema.parse(toCamelCase<WorkoutLog>(data))
})
