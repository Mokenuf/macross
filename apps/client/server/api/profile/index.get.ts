import type { Profile } from '@macross/shared'
import { profileSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Profile> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('clients')
    .select(
      'id, full_name, email, avatar_url, birth_date, weight_kg, height_cm, level, goal, desired_weekly_frequency, trainer:trainers(id, full_name)',
    )
    .eq('id', user.sub)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo cargar tu perfil' })
  }

  if (!data) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Tu cuenta está desactivada. Contactá a tu entrenador.',
    })
  }

  return profileSchema.parse(toCamelCase<Profile>(data))
})
