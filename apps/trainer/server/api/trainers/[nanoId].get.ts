import { Trainer, trainerSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Trainer> => {
  const nanoId = getRouterParam(event, 'nanoId')

  if (!nanoId) throw createError({ statusCode: 400, statusMessage: 'Nano ID is required' })

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('trainers')
    .select('*')
    .eq('nano_id', nanoId)
    .is('deleted_at', null)
    .single()

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al obtener el entrenador',
    })

  if (!data) throw createError({ statusCode: 404, statusMessage: 'Entrenador no encontrado' })

  const { count } = await client
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('trainer_id', data.id)
    .is('deleted_at', null)

  const trainer = trainerSchema.parse({ ...toCamelCase<Trainer>(data), totalClients: count ?? 0 })

  return trainer
})
