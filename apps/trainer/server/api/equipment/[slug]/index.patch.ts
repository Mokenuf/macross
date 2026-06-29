import { Equipment, equipmentSchema, UpdateEquipment, updateEquipmentSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Equipment> => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const body = await readValidatedBody<UpdateEquipment>(event, updateEquipmentSchema.parse)
  const client = await serverSupabaseClient(event)

  const newSlug = generateSlug(body.nameEs)

  if (newSlug !== slug) {
    const { count } = await client
      .from('equipment')
      .select('*', { count: 'exact', head: true })
      .eq('slug', newSlug)
      .is('deleted_at', null)
    if (count && count > 0)
      throw createError({
        statusCode: 409,
        statusMessage: 'Ya existe un equipamiento con este nombre',
      })
  }

  const { data, error } = await client
    .from('equipment')
    .update({
      name_es: body.nameEs,
      name_en: body.nameEn,
      slug: newSlug,
    })
    .eq('slug', slug)
    .is('deleted_at', null)
    .select()
    .single()

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al actualizar el equipamiento',
    })

  if (!data) throw createError({ statusCode: 404, statusMessage: 'Equipamiento no encontrado' })

  const equipment = equipmentSchema.parse(toCamelCase<Equipment>(data))

  return equipment
})
