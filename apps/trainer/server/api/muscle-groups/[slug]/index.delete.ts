import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const client = await serverSupabaseClient(event)

  const { data: muscleGroup, error: findError } = await client
    .from('muscle_groups')
    .select('id')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (findError || !muscleGroup)
    throw createError({
      statusCode: 404,
      statusMessage: findError?.message ?? 'Grupo muscular no encontrado',
    })

  const { error: pivotError } = await client
    .from('exercise_muscle_groups')
    .delete()
    .eq('muscle_group_id', muscleGroup.id)

  if (pivotError)
    throw createError({
      statusCode: 500,
      statusMessage: pivotError.message ?? 'Error al desasignar el grupo muscular',
    })

  const { error } = await client
    .from('muscle_groups')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', muscleGroup.id)
    .is('deleted_at', null)

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al eliminar el grupo muscular',
    })

  return { success: true }
})
