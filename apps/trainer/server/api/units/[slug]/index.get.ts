import type { Unit } from '@macross/shared'
import { unitSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Unit> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('units')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al obtener la unidad',
    })

  if (!data) throw createError({ statusCode: 404, statusMessage: 'Unidad no encontrada' })

  const unit = unitSchema.parse(toCamelCase<Unit>(data))

  return unit
})
