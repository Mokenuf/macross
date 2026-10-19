import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const client = await serverSupabaseClient(event)

  const { data: unit, error: findError } = await client
    .from('units')
    .select('id, is_default')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (findError || !unit)
    throw createError({
      statusCode: 404,
      statusMessage: findError?.message ?? 'Unidad no encontrada',
    })

  // Sin default, un ejercicio nuevo no tendría con qué arrancar.
  if (unit.is_default)
    throw createError({
      statusCode: 409,
      statusMessage: 'No se puede eliminar la unidad por defecto',
    })

  // Caer a la default reinterpretaría el historial: "45 s" pasaría a leerse "45 reps".
  const { count, error: countError } = await client
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('unit_id', unit.id)
    .is('deleted_at', null)

  if (countError) throw createError({ statusCode: 500, statusMessage: countError.message })

  if (count)
    throw createError({
      statusCode: 409,
      statusMessage: 'La unidad está en uso: reasigná sus ejercicios antes de eliminarla',
    })

  const { error } = await client
    .from('units')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', unit.id)
    .is('deleted_at', null)

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al eliminar la unidad',
    })

  return { success: true }
})
