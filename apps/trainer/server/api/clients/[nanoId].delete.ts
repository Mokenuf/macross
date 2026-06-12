import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

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

  const { error } = await client
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', target.id)
    .is('deleted_at', null)
  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al eliminar el cliente',
    })

  return { success: true }
})
