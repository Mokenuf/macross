import { Client, clientSchema, UpdateClient, updateClientSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Client> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const nanoId = getRouterParam(event, 'nanoId')
  if (!nanoId) throw createError({ statusCode: 400, statusMessage: 'Nano ID is required' })

  const client = await serverSupabaseClient(event)

  const { data: caller } = await client.from('trainers').select('role').eq('id', user.sub).single()
  if (!caller) throw createError({ statusCode: 403, statusMessage: 'No autorizado' })

  const { data: target, error: findError } = await client
    .from('clients')
    .select('trainer_id')
    .eq('nano_id', nanoId)
    .is('deleted_at', null)
    .single()
  if (findError || !target)
    throw createError({ statusCode: 404, statusMessage: 'Cliente no encontrado' })

  // El trainer solo puede editar sus clientes; el manager, cualquiera
  const isManager = caller.role === 'manager'
  if (!isManager && target.trainer_id !== user.sub)
    throw createError({ statusCode: 403, statusMessage: 'No autorizado' })

  const body = await readValidatedBody<UpdateClient>(event, updateClientSchema.parse)

  const { data, error } = await client
    .from('clients')
    .update({
      full_name: body.fullName,
      phone: body.phone ?? null,
      avatar_url: body.avatarUrl ?? null,
      birth_date: body.birthDate ?? null,
      weight_kg: body.weightKg ?? null,
      height_cm: body.heightCm ?? null,
      level: body.level ?? null,
      goal: body.goal?.length ? body.goal : null,
      desired_weekly_frequency: body.desiredWeeklyFrequency ?? null,
      injuries: body.injuries ?? null,
      available_equipment: body.availableEquipment ?? null,
      notes: body.notes ?? null,
      // Solo el manager puede reasignar el cliente a otro trainer
      ...(isManager && body.trainerId ? { trainer_id: body.trainerId } : {}),
    })
    .eq('nano_id', nanoId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al actualizar el cliente',
    })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Cliente no encontrado' })

  const userClient = clientSchema.parse(toCamelCase<Client>(data))

  return userClient
})
