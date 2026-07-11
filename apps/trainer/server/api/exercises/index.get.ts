import type {
  BaseResponse,
  Exercise,
  ExerciseQueryParams,
  ExerciseWithPivot,
} from '@macross/shared'
import { exerciseQueryParamsSchema, exerciseSchema, exerciseWithPivotSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

const sortColumnMap: Record<string, string> = {
  name: 'name_es',
  createdAt: 'created_at',
}

export default defineEventHandler(async (event): Promise<BaseResponse<Exercise>> => {
  const queryParams = await getValidatedQuery<ExerciseQueryParams>(
    event,
    exerciseQueryParamsSchema.parse,
  )
  const client = await serverSupabaseClient(event)

  // Filtrar el embed recortaría muscleGroups a solo los grupos filtrados y rompería el count: en su
  // lugar traemos los exercise_id que pegan a cualquiera (OR) y filtramos el query con .in('id', ...).
  let muscleGroupExerciseIds: string[] | null = null
  if (queryParams.muscleGroupIds.length > 0) {
    const { data: pivotRows, error: pivotError } = await client
      .from('exercise_muscle_groups')
      .select('exercise_id')
      .in('muscle_group_id', queryParams.muscleGroupIds)

    if (pivotError)
      throw createError({
        statusCode: 500,
        statusMessage: pivotError.message ?? 'Error al filtrar por grupo muscular',
      })

    muscleGroupExerciseIds = [...new Set((pivotRows ?? []).map(r => r.exercise_id))]
  }

  const from = (queryParams.page - 1) * queryParams.limit
  const to = from + queryParams.limit - 1

  let supabaseQuery = client
    .from('exercises')
    .select('*, equipment(*), exercise_muscle_groups(muscle_groups!inner(*))', { count: 'exact' })
    .is('deleted_at', null)
    .is('equipment.deleted_at', null)
    .is('exercise_muscle_groups.muscle_groups.deleted_at', null)
    .order(sortColumnMap[queryParams.sort] ?? 'created_at', {
      ascending: queryParams.order === 'asc',
    })
    .range(from, to)
  if (queryParams.search) {
    supabaseQuery = supabaseQuery.or(
      `name_es.ilike.%${queryParams.search}%,name_en.ilike.%${queryParams.search}%`,
    )
  }
  if (queryParams.equipmentIds.length > 0) {
    supabaseQuery = supabaseQuery.in('equipment_id', queryParams.equipmentIds)
  }
  if (muscleGroupExerciseIds !== null) {
    supabaseQuery = supabaseQuery.in('id', muscleGroupExerciseIds)
  }

  const { data, error, count } = await supabaseQuery

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al obtener los ejercicios',
    })
  }

  if (!data) throw createError({ statusCode: 404, statusMessage: 'Ejercicios no encontrados' })

  const rows = parsePivotArray<ExerciseWithPivot, Exercise>(
    data ?? [],
    exerciseWithPivotSchema,
    exerciseSchema,
    toExercise,
  )

  // Total del catálogo (ignora search/facetas) para el subtítulo "N en catálogo".
  const { count: activeCount } = await client
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  return {
    rows,
    pagination: {
      page: queryParams.page,
      limit: queryParams.limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / queryParams.limit),
    },
    counts: { active: activeCount ?? 0 },
  }
})
