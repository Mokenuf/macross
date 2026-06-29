import {
  Exercise,
  exerciseSchema,
  ExerciseWithPivot,
  exerciseWithPivotSchema,
} from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Exercise> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('exercises')
    .select('*, equipment(*), exercise_muscle_groups(muscle_groups!inner(*))')
    .eq('slug', slug)
    .is('deleted_at', null)
    .is('equipment.deleted_at', null)
    .is('exercise_muscle_groups.muscle_groups.deleted_at', null)
    .single()

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al obtener el ejercicio',
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
