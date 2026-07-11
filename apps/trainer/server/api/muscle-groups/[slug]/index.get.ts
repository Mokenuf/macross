import type { MuscleGroup } from '@macross/shared'
import { muscleGroupSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event): Promise<MuscleGroup> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('muscle_groups')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al obtener el grupo muscular',
    })

  if (!data) throw createError({ statusCode: 404, statusMessage: 'Grupo muscular no encontrado' })

  const { count } = await client
    .from('exercise_muscle_groups')
    .select('exercises!inner(id)', { count: 'exact', head: true })
    .eq('muscle_group_id', data.id)
    .is('exercises.deleted_at', null)

  const muscleGroup = muscleGroupSchema.parse({
    ...toCamelCase<MuscleGroup>(data),
    exerciseCount: count ?? 0,
  })

  return muscleGroup
})
