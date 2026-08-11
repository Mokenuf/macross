import { loginSchema, type Login } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const body = await readValidatedBody<Login>(event, loginSchema.parse)

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  })

  if (error) {
    throw createError({
      statusCode: 401,
      statusMessage: error.message ?? 'Email o contraseña incorrectos',
    })
  }

  const { data: profile } = await client
    .from('trainers')
    .select('deleted_at')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!profile || profile.deleted_at) {
    await client.auth.signOut()
    throw createError({
      statusCode: 403,
      statusMessage: 'Tu cuenta no tiene acceso al panel. Contactá al administrador.',
    })
  }

  return { user: data.user, session: data.session }
})
