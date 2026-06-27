import { Client, clientSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Client> => {
  const nanoId = getRouterParam(event, 'nanoId')

  if (!nanoId) throw createError({ statusCode: 400, statusMessage: 'Nano ID is required' })

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('clients')
    .select('*, trainer:trainers!trainer_id(id, full_name, nano_id)')
    .eq('nano_id', nanoId)
    .is('deleted_at', null)
    .single()

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al obtener el cliente',
    })

  if (!data) throw createError({ statusCode: 404, statusMessage: 'Cliente no encontrado' })

  const userClient = clientSchema.parse(toCamelCase<Client>(data))

  return userClient
})
