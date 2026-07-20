import type { Routine } from '@macross/shared'
import { routineSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

const treeSelect = `
  *,
  days:routine_days(
    *,
    blocks:routine_blocks(
      *,
      exercises:routine_exercises(
        *,
        exercise:exercises(id, name_es, name_en, video_url, slug, nano_id, equipment(*)),
        schemes:routine_exercise_schemes(*)
      )
    )
  )
`

export default defineEventHandler(async (event): Promise<Routine | null> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('routines')
    .select(treeSelect)
    // Anti-compartir: solo la fase activa se le muestra al cliente (regla de producto, no RLS)
    .eq('client_id', user.sub)
    .eq('active', true)
    .eq('is_template', false)
    .is('deleted_at', null)
    .is('days.deleted_at', null)
    .is('days.blocks.deleted_at', null)
    .is('days.blocks.exercises.deleted_at', null)
    .order('day_number', { referencedTable: 'days' })
    .order('sort_order', { referencedTable: 'days.blocks' })
    .order('sort_order', { referencedTable: 'days.blocks.exercises' })
    .order('week_number', { referencedTable: 'days.blocks.exercises.schemes' })
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo cargar tu planificación' })
  }

  if (!data) return null

  return routineSchema.parse(toCamelCase<Routine>(data))
})
