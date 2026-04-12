import { muscleGroupSchema, UpdateMuscleGroup, updateMuscleGroupSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const body = await readValidatedBody<UpdateMuscleGroup>(event, updateMuscleGroupSchema.parse)
  const client = await serverSupabaseClient(event)

  const newSlug = generateSlug(body.name)

  if (newSlug !== slug) {
    const { count } = await client
      .from('muscle_groups')
      .select('*', { count: 'exact', head: true })
      .eq('slug', newSlug)
      .is('deleted_at', null)
    if (count && count > 0)
      throw createError({
        statusCode: 409,
        statusMessage: 'Ya existe un grupo muscular con este nombre',
      })
  }

  const { data, error } = await client
    .from('muscle_groups')
    .update({
      name: body.name,
      slug: newSlug,
    })
    .eq('slug', slug)
    .is('deleted_at', null)
    .select()
    .single()

  if (error || !data)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al actualizar el grupo muscular',
    })

  const muscleGroup = muscleGroupSchema.parse(toCamelCase(data))

  return muscleGroup
})
