import type { BaseResponse, Equipment, EquipmentQueryParams } from '@macross/shared'
import { equipmentQueryParamsSchema, equipmentSchema } from '@macross/shared'
import { z } from 'zod'

import { serverSupabaseClient } from '#supabase/server'

const sortColumnMap: Record<string, string> = {
  name: 'name_es',
  createdAt: 'created_at',
}

export default defineEventHandler(async (event): Promise<BaseResponse<Equipment>> => {
  const queryParams = await getValidatedQuery<EquipmentQueryParams>(
    event,
    equipmentQueryParamsSchema.parse,
  )
  const client = await serverSupabaseClient(event)

  const from = (queryParams.page - 1) * queryParams.limit
  const to = from + queryParams.limit - 1

  let supabaseQuery = client
    .from('equipment')
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
      statusMessage: error.message ?? 'Error al obtener el equipamiento',
    })
  }

  const rows = z.array(equipmentSchema).parse(toCamelCase<Equipment[]>(data ?? []))

  // Total del catálogo (ignora search) para el subtítulo "N en catálogo".
  const { count: activeCount } = await client
    .from('equipment')
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
