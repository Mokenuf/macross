import {
  BaseResponse,
  Client,
  ClientQueryParams,
  clientQueryParamsSchema,
  clientSchema,
} from '@macross/shared'
import { z } from 'zod'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

const sortColumnMap: Record<string, string> = {
  fullName: 'full_name',
  createdAt: 'created_at',
}

export default defineEventHandler(async (event): Promise<BaseResponse<Client>> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const queryParams = await getValidatedQuery<ClientQueryParams>(
    event,
    clientQueryParamsSchema.parse,
  )
  const client = await serverSupabaseClient(event)

  const { data: caller } = await client.from('trainers').select('role').eq('id', user.sub).single()
  if (!caller) throw createError({ statusCode: 403, statusMessage: 'No autorizado' })

  const from = (queryParams.page - 1) * queryParams.limit
  const to = from + queryParams.limit - 1

  let supabaseQuery = client
    .from('clients')
    .select('*, trainer:trainers!trainer_id(id, full_name, nano_id)', { count: 'exact' })
    .is('deleted_at', null)
    .order(sortColumnMap[queryParams.sort] ?? 'created_at', {
      ascending: queryParams.order === 'asc',
    })
    .range(from, to)

  // Scoping: el trainer solo ve los suyos; el manager puede filtrar por trainer
  if (caller.role === 'trainer') {
    supabaseQuery = supabaseQuery.eq('trainer_id', user.sub)
  } else if (queryParams.trainerId) {
    supabaseQuery = supabaseQuery.eq('trainer_id', queryParams.trainerId)
  }

  if (queryParams.search) {
    supabaseQuery = supabaseQuery.or(
      `full_name.ilike.%${queryParams.search}%,email.ilike.%${queryParams.search}%`,
    )
  }

  const { data, error, count } = await supabaseQuery

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al obtener los clientes',
    })
  }

  const rows = z.array(clientSchema).parse(toCamelCase<Client[]>(data ?? []))

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
