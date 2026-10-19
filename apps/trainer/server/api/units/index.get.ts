import type { BaseResponse, Unit, UnitQueryParams } from '@macross/shared'
import { unitQueryParamsSchema, unitSchema } from '@macross/shared'
import { z } from 'zod'

import { serverSupabaseClient } from '#supabase/server'

const sortColumnMap: Record<string, string> = {
  name: 'name_es',
  createdAt: 'created_at',
}

export default defineEventHandler(async (event): Promise<BaseResponse<Unit>> => {
  const queryParams = await getValidatedQuery<UnitQueryParams>(event, unitQueryParamsSchema.parse)
  const client = await serverSupabaseClient(event)

  const from = (queryParams.page - 1) * queryParams.limit
  const to = from + queryParams.limit - 1

  let supabaseQuery = client
    .from('units')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order(sortColumnMap[queryParams.sort] ?? 'created_at', {
      ascending: queryParams.order === 'asc',
    })
    .range(from, to)
  if (queryParams.search) {
    supabaseQuery = supabaseQuery.or(
      `name_es.ilike.%${queryParams.search}%,name_en.ilike.%${queryParams.search}%`,
    )
  }

  const { data, error, count } = await supabaseQuery

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al obtener las unidades',
    })
  }

  const rows = z.array(unitSchema).parse(toCamelCase<Unit[]>(data ?? []))

  const { count: activeCount } = await client
    .from('units')
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
