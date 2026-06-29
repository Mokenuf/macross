import { Trainer, trainerSchema, UpdateTrainer, updateTrainerSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Trainer> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const client = await serverSupabaseClient(event)

  const { data: caller } = await client.from('trainers').select('role').eq('id', user.sub).single()
  if (caller?.role !== 'manager')
    throw createError({
      statusCode: 403,
      statusMessage: 'Solo managers pueden actualizar entrenadores',
    })

  const nanoId = getRouterParam(event, 'nanoId')
  if (!nanoId) throw createError({ statusCode: 400, statusMessage: 'Nano ID is required' })

  const body = await readValidatedBody<UpdateTrainer>(event, updateTrainerSchema.parse)

  const { data, error } = await client
    .from('trainers')
    .update({
      full_name: body.fullName,
      phone: body.phone ?? null,
      avatar_url: body.avatarUrl ?? null,
    })
    .eq('nano_id', nanoId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al actualizar el entrenador',
    })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Entrenador no encontrado' })

  const trainer = trainerSchema.parse(toCamelCase<Trainer>(data))

  return trainer
})
