import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const client = await serverSupabaseClient(event)

  const { data: equipment, error: findError } = await client
    .from('equipment')
    .select('id')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (findError || !equipment)
    throw createError({
      statusCode: 404,
      statusMessage: findError?.message ?? 'Equipamiento no encontrado',
    })

  // Soft delete no dispara el `on delete set null` de la FK: desasignamos a mano (espejo del pivot de muscle_groups).
  const { error: unassignError } = await client
    .from('exercises')
    .update({ equipment_id: null })
    .eq('equipment_id', equipment.id)

  if (unassignError)
    throw createError({
      statusCode: 500,
      statusMessage: unassignError.message ?? 'Error al desasignar el equipamiento',
    })

  const { error } = await client
    .from('equipment')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', equipment.id)
    .is('deleted_at', null)

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al eliminar el equipamiento',
    })

  return { success: true }
})
