import type { Equipment } from '@macross/shared'
import { equipmentSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Equipment> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('equipment')
    .select('*')
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al obtener el equipamiento',
    })

  if (!data) throw createError({ statusCode: 404, statusMessage: 'Equipamiento no encontrado' })

  const { count } = await client
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('equipment_id', data.id)
    .is('deleted_at', null)

  const equipment = equipmentSchema.parse({
    ...toCamelCase<Equipment>(data),
    exerciseCount: count ?? 0,
  })

  return equipment
})
