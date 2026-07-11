import type { BaseResponse, Trainer, TrainerQueryParams } from '@macross/shared'
import { trainerQueryParamsSchema, trainerSchema } from '@macross/shared'
import { z } from 'zod'

import { serverSupabaseClient } from '#supabase/server'

const sortColumnMap: Record<string, string> = {
  fullName: 'full_name',
  createdAt: 'created_at',
}

export default defineEventHandler(async (event): Promise<BaseResponse<Trainer>> => {
  const queryParams = await getValidatedQuery<TrainerQueryParams>(
    event,
    trainerQueryParamsSchema.parse,
  )
  const client = await serverSupabaseClient(event)

  const from = (queryParams.page - 1) * queryParams.limit
  const to = from + queryParams.limit - 1

  let supabaseQuery = client
    .from('trainers')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order(sortColumnMap[queryParams.sort] ?? 'created_at', {
      ascending: queryParams.order === 'asc',
    })
    .range(from, to)
  if (queryParams.search) {
    supabaseQuery = supabaseQuery.or(
      `full_name.ilike.%${queryParams.search}%,email.ilike.%${queryParams.search}%`,
    )
  }
  if (queryParams.role) {
    supabaseQuery = supabaseQuery.eq('role', queryParams.role)
  }

  const { data, error, count } = await supabaseQuery

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al obtener los entrenadores',
    })
  }

  const rows = z.array(trainerSchema).parse(toCamelCase<Trainer[]>(data ?? []))

  const { count: activeCount } = await client
    .from('trainers')
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
