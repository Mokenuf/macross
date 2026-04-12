import {
  BaseResponse,
  MuscleGroup,
  MuscleGroupQueryParams,
  muscleGroupQueryParamsSchema,
  muscleGroupSchema,
} from '@macross/shared'
import { z } from 'zod'

import { serverSupabaseClient } from '#supabase/server'

const sortColumnMap: Record<string, string> = {
  name: 'name',
  createdAt: 'created_at',
}

export default defineEventHandler(async (event): Promise<BaseResponse<MuscleGroup>> => {
  const queryParams = await getValidatedQuery<MuscleGroupQueryParams>(
    event,
    muscleGroupQueryParamsSchema.parse,
  )
  const client = await serverSupabaseClient(event)

  const from = (queryParams.page - 1) * queryParams.limit
  const to = from + queryParams.limit - 1

  let supabaseQuery = client
    .from('muscle_groups')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order(sortColumnMap[queryParams.sort] ?? 'created_at', {
      ascending: queryParams.order === 'asc',
    })
    .range(from, to)
  if (queryParams.search) {
    supabaseQuery = supabaseQuery.ilike('name', `%${queryParams.search}%`)
  }

  const { data, error, count } = await supabaseQuery

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al obtener los grupos musculares',
    })
  }

  const rows = z.array(muscleGroupSchema).parse(toCamelCase<MuscleGroup[]>(data ?? []))

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
