import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async event => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const nanoId = getRouterParam(event, 'nanoId')
  if (!nanoId) throw createError({ statusCode: 400, statusMessage: 'Falta el identificador' })

  const client = await serverSupabaseClient(event)

  const { error } = await client
    .from('routines')
    .update({ deleted_at: new Date().toISOString() })
    .eq('nano_id', nanoId)
    .is('deleted_at', null)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al eliminar la rutina',
    })
  }

  return { success: true }
})
