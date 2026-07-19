import type { Routine } from '@macross/shared'
import { routineSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Routine> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const nanoId = getRouterParam(event, 'nanoId')
  if (!nanoId) throw createError({ statusCode: 400, statusMessage: 'Falta el identificador' })

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('routines')
    .update({ active: false })
    .eq('nano_id', nanoId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: 'Rutina no encontrada' })
  }

  const routine = routineSchema.parse(toCamelCase<Routine>(data))

  return routine
})
