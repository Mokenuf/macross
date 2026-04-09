import { Exercise, exerciseSchema, UpdateExercise, updateExerciseSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const body = await readValidatedBody<UpdateExercise>(event, updateExerciseSchema.parse)
  const client = await serverSupabaseClient(event)

  const newSlug = body.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  if (newSlug !== slug) {
    const { count } = await client
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('slug', newSlug)
      .is('deleted_at', null)
    if (count && count > 0)
      throw createError({
        statusCode: 409,
        statusMessage: 'Ya existe un ejercicio con este nombre',
      })
  }

  const { data, error } = await client
    .from('exercises')
    .update({
      name: body.name,
      description: body.description ?? null,
      video_url: body.videoUrl ?? null,
      muscle_group: body.muscleGroup ?? null,
      slug: newSlug,
    })
    .eq('slug', slug)
    .is('deleted_at', null)
    .select()
    .single()

  if (error || !data)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al actualizar el ejercicio',
    })

  const exercise = exerciseSchema.parse(toCamelCase<Exercise>(data))

  return exercise
})
