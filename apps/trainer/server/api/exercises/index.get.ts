import {
  BaseResponse,
  Exercise,
  ExerciseQueryParams,
  exerciseQueryParamsSchema,
  exerciseSchema,
} from '@macross/shared'
import { z } from 'zod'

import { serverSupabaseClient } from '#supabase/server'

const sortColumnMap: Record<string, string> = {
  name: 'name',
  createdAt: 'created_at',
  muscleGroup: 'muscle_group',
}

export default defineEventHandler(async (event): Promise<BaseResponse<Exercise>> => {
  const queryParams = await getValidatedQuery<ExerciseQueryParams>(
    event,
    exerciseQueryParamsSchema.parse,
  )
  const client = await serverSupabaseClient(event)

  const from = (queryParams.page - 1) * queryParams.limit
  const to = from + queryParams.limit - 1

  let supabaseQuery = client
    .from('exercises')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order(sortColumnMap[queryParams.sort] ?? 'created_at', {
      ascending: queryParams.order === 'asc',
    })
    .range(from, to)
  if (queryParams.search) {
    supabaseQuery = supabaseQuery.ilike('name', `%${queryParams.search}%`)
  }
  if (queryParams.muscleGroup) {
    supabaseQuery = supabaseQuery.eq('muscle_group', queryParams.muscleGroup)
  }

  const { data, error, count } = await supabaseQuery

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al obtener los ejercicios',
    })
  }

  const rows = z.array(exerciseSchema).parse(toCamelCase<Exercise[]>(data ?? []))

  return {
    rows,
    pagination: {
      page: queryParams.page,
      limit: queryParams.limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / queryParams.limit),
    },
  }
})
