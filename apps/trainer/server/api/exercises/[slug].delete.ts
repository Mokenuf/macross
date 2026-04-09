import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const client = await serverSupabaseClient(event)

  const { error } = await client
    .from('exercises')
    .update({ deleted_at: new Date().toISOString() })
    .eq('slug', slug)
    .is('deleted_at', null)

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al eliminar el ejercicio',
    })

  return { success: true }
})
