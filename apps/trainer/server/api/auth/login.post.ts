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
    throw createError({ statusCode: 401, statusMessage: 'Email o contraseña incorrectos' })
  }

  return { user: data.user, session: data.session }
})
