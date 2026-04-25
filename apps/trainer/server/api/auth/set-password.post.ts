import { SetPassword, setPasswordSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async event => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const body = await readValidatedBody<SetPassword>(event, setPasswordSchema.parse)

  const client = await serverSupabaseClient(event)

  const { error } = await client.auth.updateUser({ password: body.password })

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al actualizar la contraseña',
    })
})
