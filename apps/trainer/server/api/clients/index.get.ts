import type { BaseResponse, Client, ClientQueryParams } from '@macross/shared'
import { clientQueryParamsSchema, clientSchema } from '@macross/shared'
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
    .order(sortColumnMap[queryParams.sort] ?? 'created_at', {
      ascending: queryParams.order === 'asc',
    })
    .range(from, to)

  // Estado derivado del deleted_at: 'all' no filtra, 'active' = vivos, 'deleted' = soft-deleted
  if (queryParams.status === 'active') {
    supabaseQuery = supabaseQuery.is('deleted_at', null)
  } else if (queryParams.status === 'deleted') {
    supabaseQuery = supabaseQuery.not('deleted_at', 'is', null)
  }

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

  if (queryParams.level) {
    supabaseQuery = supabaseQuery.eq('level', queryParams.level)
  }
  if (queryParams.goal.length > 0) {
    supabaseQuery = supabaseQuery.overlaps('goal', queryParams.goal)
  }

  const { data, error, count } = await supabaseQuery

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al obtener los clientes',
    })
  }

  const rows = z.array(clientSchema).parse(toCamelCase<Client[]>(data ?? []))

  // Counts del scope del rol, ignorando search/status/trainerId: el subtítulo es un total estable.
  const scopedCount = () => {
    const q = client.from('clients').select('*', { count: 'exact', head: true })
    return caller.role === 'trainer' ? q.eq('trainer_id', user.sub) : q
  }
  const [{ count: activeCount }, { count: totalCount }] = await Promise.all([
    scopedCount().is('deleted_at', null),
    scopedCount(),
  ])

  return {
    rows,
    pagination: {
      page: queryParams.page,
      limit: queryParams.limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / queryParams.limit),
    },
    counts: { active: activeCount ?? 0, total: totalCount ?? 0 },
  }
})
