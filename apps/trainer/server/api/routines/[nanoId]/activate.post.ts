import type { Routine } from '@macross/shared'
import { routineSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Routine> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const nanoId = getRouterParam(event, 'nanoId')
  if (!nanoId) throw createError({ statusCode: 400, statusMessage: 'Falta el identificador' })

  const client = await serverSupabaseClient(event)

  const { data: targetRaw, error: targetError } = await client
    .from('routines')
    .select('id, client_id')
    .eq('nano_id', nanoId)
    .is('deleted_at', null)
    .single()

  if (targetError || !targetRaw) {
    throw createError({ statusCode: 404, statusMessage: 'Rutina no encontrada' })
  }

  const target = toCamelCase<{ id: string; clientId: string | null }>(targetRaw)

  // Una activa por cliente: se desactiva la vigente antes de activar esta (respeta el índice único parcial).
  if (target.clientId) {
    const { error: deactivateError } = await client
      .from('routines')
      .update({ active: false })
      .eq('client_id', target.clientId)
      .eq('active', true)
      .is('deleted_at', null)
    if (deactivateError)
      throw createError({
        statusCode: 500,
        statusMessage: deactivateError.message ?? 'Error al desactivar rutinas previas',
      })
  }

  const { data, error } = await client
    .from('routines')
    .update({ active: true })
    .eq('id', target.id)
    .select()
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al activar la rutina',
    })
  }

  const routine = routineSchema.parse(toCamelCase<Routine>(data))

  return routine
})
