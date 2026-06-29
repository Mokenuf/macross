import { env } from '@@/env'
import { type RequestPasswordReset, requestPasswordResetSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const { email } = await readValidatedBody<RequestPasswordReset>(
    event,
    requestPasswordResetSchema.parse,
  )

  const client = await serverSupabaseClient(event)
  const redirectTo = `${env.NUXT_TRAINER_APP_URL}/auth/reset-password`

  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo })

  // No revelamos si el email existe: resetPasswordForEmail no falla por email inexistente.
  // Solo propagamos errores reales de infraestructura (SMTP, rate limit, etc.).
  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al enviar el mail de recuperación',
    })
})
