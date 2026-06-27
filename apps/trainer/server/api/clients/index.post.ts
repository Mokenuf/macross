import { env } from '@@/env'
import { Client, clientSchema, CreateClient, createClientSchema } from '@macross/shared'

import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '#supabase/server'

export default defineEventHandler(async (event): Promise<Client> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const client = await serverSupabaseClient(event)

  // El caller debe ser manager o trainer
  const { data: caller } = await client.from('trainers').select('role').eq('id', user.sub).single()
  if (caller?.role !== 'manager' && caller?.role !== 'trainer')
    throw createError({
      statusCode: 403,
      statusMessage: 'Solo managers o entrenadores pueden invitar clientes',
    })

  const body = await readValidatedBody<CreateClient>(event, createClientSchema.parse)

  // El trainer se auto-asigna; el manager elige (el body manda, pero solo para manager)
  const trainerId = caller.role === 'trainer' ? user.sub : body.trainerId
  if (!trainerId)
    throw createError({ statusCode: 400, statusMessage: 'Debe asignar un entrenador al cliente' })

  const { data: existing } = await client
    .from('clients')
    .select('deleted_at')
    .eq('email', body.email)
    .maybeSingle()
  if (existing) {
    if (!existing.deleted_at)
      throw createError({ statusCode: 409, statusMessage: 'Ya existe un cliente con este mail' })
    // El cliente está eliminado pero su auth.users sigue vivo, avisar el estado.
    throw createError({
      statusCode: 409,
      statusMessage: 'Este mail pertenece a un cliente eliminado',
    })
  }

  const adminClient = await serverSupabaseServiceRole(event)

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    body.email,
    { redirectTo: `${env.NUXT_CLIENT_APP_URL}/auth/set-password` },
  )
  if (inviteError || !invited?.user) {
    if (inviteError?.code === 'email_exists')
      throw createError({ statusCode: 409, statusMessage: 'Este email ya está registrado' })
    throw createError({
      statusCode: 500,
      statusMessage: inviteError?.message ?? 'Error al invitar al cliente',
    })
  }

  const { data, error } = await adminClient
    .from('clients')
    .insert({
      id: invited.user.id,
      trainer_id: trainerId,
      full_name: body.fullName,
      email: body.email,
      phone: body.phone ?? null,
      birth_date: body.birthDate ?? null,
      weight_kg: body.weightKg ?? null,
      height_cm: body.heightCm ?? null,
      level: body.level ?? null,
      goal: body.goal?.length ? body.goal : null,
      desired_weekly_frequency: body.desiredWeeklyFrequency ?? null,
      injuries: body.injuries ?? null,
      available_equipment: body.availableEquipment ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    // Rollback: borrar el user invitado si el insert falla
    await adminClient.auth.admin.deleteUser(invited.user.id)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al crear el cliente',
    })
  }

  const newClient = clientSchema.parse(toCamelCase<Client>(data))

  return newClient
})
