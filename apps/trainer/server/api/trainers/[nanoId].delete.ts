import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async event => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const client = await serverSupabaseClient(event)
  const { data: caller } = await client.from('trainers').select('role').eq('id', user.sub).single()

  if (caller?.role !== 'manager')
    throw createError({
      statusCode: 403,
      statusMessage: 'Solo managers pueden eliminar entrenadores',
    })

  const nanoId = getRouterParam(event, 'nanoId')
  if (!nanoId) throw createError({ statusCode: 400, statusMessage: 'Nano ID is required' })

  const { data: target, error: findError } = await client
    .from('trainers')
    .select('id, role')
    .eq('nano_id', nanoId)
    .is('deleted_at', null)
    .single()
  if (findError || !target)
    throw createError({ statusCode: 404, statusMessage: 'Entrenador no encontrado' })

  if (target.role === 'manager')
    throw createError({ statusCode: 403, statusMessage: 'No se puede eliminar un manager' })

  const { error } = await client
    .from('trainers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', target.id)
    .is('deleted_at', null)
  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al eliminar el entrenador',
    })

  return { success: true }
})
