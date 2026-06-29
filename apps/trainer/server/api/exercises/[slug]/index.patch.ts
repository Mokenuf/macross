import type { UpdateExercise, Exercise, ExerciseWithPivot } from '@macross/shared'
import { exerciseSchema, updateExerciseSchema, exerciseWithPivotSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Exercise> => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const body = await readValidatedBody<UpdateExercise>(event, updateExerciseSchema.parse)
  const client = await serverSupabaseClient(event)

  const newSlug = generateSlug(body.nameEs)

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

  const { data: updatedExercise, error: updateError } = await client
    .from('exercises')
    .update({
      name_es: body.nameEs,
      name_en: body.nameEn,
      description_es: body.descriptionEs ?? null,
      description_en: body.descriptionEn ?? null,
      video_url: body.videoUrl ?? null,
      equipment_id: body.equipmentId ?? null,
      slug: newSlug,
    })
    .eq('slug', slug)
    .is('deleted_at', null)
    .select()
    .single()

  if (updateError)
    throw createError({
      statusCode: 500,
      statusMessage: updateError?.message ?? 'Error al actualizar el ejercicio',
    })

  if (!updatedExercise)
    throw createError({ statusCode: 404, statusMessage: 'Ejercicio no encontrado' })

  await client.from('exercise_muscle_groups').delete().eq('exercise_id', updatedExercise.id)

  if (body.muscleGroupIds.length > 0) {
    const { error: pivotError } = await client.from('exercise_muscle_groups').insert(
      body.muscleGroupIds.map(id => ({
        exercise_id: updatedExercise.id,
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
    .select('*, equipment(*), exercise_muscle_groups(muscle_groups(*))')
    .eq('id', updatedExercise.id)
    .single()

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al obtener el ejercicio actualizado',
    })

  if (!data) throw createError({ statusCode: 404, statusMessage: 'Ejercicio no encontrado' })

  const exercise = parsePivot<ExerciseWithPivot, Exercise>(
    data,
    exerciseWithPivotSchema,
    exerciseSchema,
    toExercise,
  )

  return exercise
})
