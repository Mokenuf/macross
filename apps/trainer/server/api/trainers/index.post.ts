import { env } from '@@/env'
import type { CreateTrainer, Trainer } from '@macross/shared'
import { createTrainerSchema, Roles, trainerSchema } from '@macross/shared'

import {
  serverSupabaseClient,
  serverSupabaseUser,
  serverSupabaseServiceRole,
} from '#supabase/server'

export default defineEventHandler(async (event): Promise<Trainer> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const client = await serverSupabaseClient(event)

  // Check caller's role
  const { data: caller } = await client.from('trainers').select('role').eq('id', user.sub).single()
  if (caller?.role !== 'manager')
    throw createError({
      statusCode: 403,
      statusMessage: 'Solo managers pueden invitar entrenadores',
    })

  const body = await readValidatedBody<CreateTrainer>(event, createTrainerSchema.parse)

  const { count } = await client
    .from('trainers')
    .select('*', { count: 'exact', head: true })
    .eq('email', body.email)
    .is('deleted_at', null)
  if (count && count > 0)
    throw createError({ statusCode: 409, statusMessage: 'Ya existe un entrenador con este email' })

  const adminClient = await serverSupabaseServiceRole(event)

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    body.email,
    { redirectTo: `${env.NUXT_TRAINER_APP_URL}/auth/set-password` },
  )
  if (inviteError || !invited?.user)
    throw createError({
      statusCode: 500,
      statusMessage: inviteError?.message ?? 'Error al invitar al entrenador',
    })

  const { data, error } = await adminClient
    .from('trainers')
    .insert({
      id: invited.user.id,
      full_name: body.fullName,
      email: body.email,
      role: Roles.trainer,
      phone: body.phone ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    // Rollback invited user if insert fails
    await adminClient.auth.admin.deleteUser(invited.user.id)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al crear el entrenador',
    })
  }

  const trainer = trainerSchema.parse(toCamelCase<Trainer>(data))

  return trainer
})
