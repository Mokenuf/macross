import { Exercise, exerciseSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('exercises')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (error || !data)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al obtener el ejercicio',
    })

  const exercise = exerciseSchema.parse(toCamelCase<Exercise>(data))

  return exercise
})
