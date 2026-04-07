import { CreateExercise, createExerciseSchema, Exercise, exerciseSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async event => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const body = await readValidatedBody<CreateExercise>(event, createExerciseSchema.parse)
  const client = await serverSupabaseClient(event)

  const slug = body.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { count } = await client
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('slug', slug)
    .is('deleted_at', null)

  if (count && count > 0)
    throw createError({ statusCode: 409, statusMessage: 'Ya existe un ejercicio con este nombre' })

  const { data, error } = await client
    .from('exercises')
    .insert({
      trainer_id: user.sub,
      name: body.name,
      description: body.description ?? null,
      video_url: body.videoUrl ?? null,
      muscle_group: body.muscleGroup ?? null,
      slug,
    })
    .select()
    .single()

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al crear el ejercicio',
    })

  const exercise = exerciseSchema.parse(toCamelCase<Exercise>(data))

  return exercise
})
