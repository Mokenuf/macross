import type { BaseResponse, Routine, RoutineQueryParams } from '@macross/shared'
import { routineQueryParamsSchema, routineSchema } from '@macross/shared'
import { z } from 'zod'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

const sortColumnMap: Record<string, string> = {
  name: 'name',
  createdAt: 'created_at',
}

export default defineEventHandler(async (event): Promise<BaseResponse<Routine>> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const queryParams = await getValidatedQuery<RoutineQueryParams>(
    event,
    routineQueryParamsSchema.parse,
  )
  const client = await serverSupabaseClient(event)

  const { data: caller } = await client.from('trainers').select('role').eq('id', user.sub).single()
  if (!caller) throw createError({ statusCode: 403, statusMessage: 'No autorizado' })

  const from = (queryParams.page - 1) * queryParams.limit
  const to = from + queryParams.limit - 1

  let supabaseQuery = client
    .from('routines')
    .select('*, client:clients!client_id(id, full_name, nano_id)', { count: 'exact' })
    .is('deleted_at', null)
    .eq('is_template', false)
    .order(sortColumnMap[queryParams.sort] ?? 'created_at', {
      ascending: queryParams.order === 'asc',
    })
    .range(from, to)

  // Finalizar una rutina es active=false, NO soft-delete: el status mapea a la columna `active`.
  if (queryParams.status === 'active') {
    supabaseQuery = supabaseQuery.eq('active', true)
  } else if (queryParams.status === 'finished') {
    supabaseQuery = supabaseQuery.eq('active', false)
  }

  // Scoping: el trainer solo ve las suyas; el manager puede filtrar por cliente.
  if (caller.role === 'trainer') {
    supabaseQuery = supabaseQuery.eq('trainer_id', user.sub)
  } else if (queryParams.clientId) {
    supabaseQuery = supabaseQuery.eq('client_id', queryParams.clientId)
  }

  if (queryParams.search) {
    supabaseQuery = supabaseQuery.ilike('name', `%${queryParams.search}%`)
  }

  const { data, error, count } = await supabaseQuery

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? 'Error al obtener las rutinas',
    })
  }

  const rows = z.array(routineSchema).parse(toCamelCase<Routine[]>(data ?? []))

  // Total activo del scope del rol, ignorando search/status/clientId: subtítulo estable.
  const scopedCount = () =>
    client
      .from('routines')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('is_template', false)
      .eq('active', true)
  const activeQuery =
    caller.role === 'trainer' ? scopedCount().eq('trainer_id', user.sub) : scopedCount()
  const { count: activeCount } = await activeQuery

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
