import {
  CreateExercise,
  createExerciseSchema,
  exerciseSchema,
  exerciseWithPivotSchema,
} from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async event => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const body = await readValidatedBody<CreateExercise>(event, createExerciseSchema.parse)
  const client = await serverSupabaseClient(event)

  const slug = generateSlug(body.name)

  const { count } = await client
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('slug', slug)
    .is('deleted_at', null)

  if (count && count > 0)
    throw createError({ statusCode: 409, statusMessage: 'Ya existe un ejercicio con este nombre' })

  const { data: insertedExercise, error: insertError } = await client
    .from('exercises')
    .insert({
      trainer_id: user.sub,
      name: body.name,
      description: body.description ?? null,
      video_url: body.videoUrl ?? null,
      slug,
    })
    .select()
    .single()

  if (insertError)
    throw createError({
      statusCode: 500,
      statusMessage: insertError.message ?? 'Error al crear el ejercicio',
    })

  if (body.muscleGroupIds.length > 0) {
    const { error: pivotError } = await client.from('exercise_muscle_groups').insert(
      body.muscleGroupIds.map(id => ({
        exercise_id: insertedExercise.id,
        muscle_group_id: id,
      })),
    )

    if (pivotError)
      throw createError({
        statusCode: 500,
        statusMessage: pivotError.message ?? 'Error al asignar grupos musculares',
      })
  }

  const { data, error } = await client
    .from('exercises')
    .select('*, exercise_muscle_groups(muscle_groups(*))')
    .eq('id', insertedExercise.id)
    .single()

  if (error || !data)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al obtener el ejercicio creado',
    })

  const exercise = parsePivot(data, exerciseWithPivotSchema, exerciseSchema, toExercise)

  return exercise
})
