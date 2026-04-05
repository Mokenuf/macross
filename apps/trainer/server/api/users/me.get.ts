import { AdminUser, adminUserSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async event => {
  const loggedUser = await serverSupabaseUser(event)

  if (!loggedUser) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('trainers')
    .select('full_name, email, role, avatar_url, phone, nano_id')
    .eq('id', loggedUser.sub)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: 'Error al obtener el usuario' })
  }

  const adminUser = adminUserSchema.parse(toCamelCase<AdminUser>(data))

  return adminUser
})
