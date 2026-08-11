import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
  serverSupabaseUser,
} from '#supabase/server'

export default defineEventHandler(async event => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const nanoId = getRouterParam(event, 'nanoId')
  if (!nanoId) throw createError({ statusCode: 400, statusMessage: 'Nano ID is required' })

  const client = await serverSupabaseClient(event)

  const { data: caller } = await client.from('trainers').select('role').eq('id', user.sub).single()
  if (!caller) throw createError({ statusCode: 403, statusMessage: 'No autorizado' })

  const { data: target, error: findError } = await client
    .from('clients')
    .select('id, trainer_id')
    .eq('nano_id', nanoId)
    .is('deleted_at', null)
    .single()
  if (findError || !target)
    throw createError({ statusCode: 404, statusMessage: 'Cliente no encontrado' })

  // El trainer solo puede eliminar sus clientes; el manager, cualquiera
  if (caller.role !== 'manager' && target.trainer_id !== user.sub)
    throw createError({ statusCode: 403, statusMessage: 'No autorizado' })

  // El soft-delete no toca auth.users: sin banear, la sesión activa del cliente sigue viva
  // indefinidamente (el refresh token se auto-renueva) y la PWA nunca se desloguea.
  const admin = serverSupabaseServiceRole(event)
  const { error: banError } = await admin.auth.admin.updateUserById(target.id, {
    ban_duration: '876000h',
  })
  if (banError)
    throw createError({
      statusCode: 500,
      statusMessage: banError.message ?? 'Error al eliminar el cliente',
    })

  const { error } = await client
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', target.id)
    .is('deleted_at', null)
  if (error) {
    // Rollback: desbanear para no dejar al cliente sin acceso con la fila todavía activa
    await admin.auth.admin.updateUserById(target.id, { ban_duration: 'none' })
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al eliminar el cliente',
    })
  }

  return { success: true }
})
