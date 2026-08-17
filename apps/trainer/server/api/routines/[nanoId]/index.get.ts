import type { Routine } from '@macross/shared'
import { routineSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

const treeSelect = `
  *,
  client:clients!client_id(id, full_name, nano_id),
  days:routine_days(
    *,
    blocks:routine_blocks(
      *,
      exercises:routine_exercises(
        *,
        exercise:exercises(id, name_es, name_en, video_url, slug, nano_id, equipment(*)),
        schemes:routine_exercise_schemes(
          *,
          logs:workout_logs(id, routine_exercise_scheme_id, set_number, weight_kg, actual_reps, completed, logged_at)
        )
      )
    )
  )
`

export default defineEventHandler(async (event): Promise<Routine> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const nanoId = getRouterParam(event, 'nanoId')
  if (!nanoId) throw createError({ statusCode: 400, statusMessage: 'Falta el identificador' })

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('routines')
    .select(treeSelect)
    .eq('nano_id', nanoId)
    .is('deleted_at', null)
    .is('days.deleted_at', null)
    .is('days.blocks.deleted_at', null)
    .is('days.blocks.exercises.deleted_at', null)
    .is('days.blocks.exercises.schemes.logs.deleted_at', null)
    .order('day_number', { referencedTable: 'days' })
    .order('sort_order', { referencedTable: 'days.blocks' })
    .order('sort_order', { referencedTable: 'days.blocks.exercises' })
    .order('week_number', { referencedTable: 'days.blocks.exercises.schemes' })
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: 'Rutina no encontrada' })
  }

  const routine = routineSchema.parse(toCamelCase<Routine>(data))
  const startWeek = findStartWeek({ id: routine.id, days: routine.days ?? [] }, routine.weeks)

  return { ...toRoutineResponse(routine), startWeek }
})
