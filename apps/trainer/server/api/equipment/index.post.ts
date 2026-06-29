import { CreateEquipment, createEquipmentSchema, equipmentSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async event => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const body = await readValidatedBody<CreateEquipment>(event, createEquipmentSchema.parse)
  const client = await serverSupabaseClient(event)

  const slug = generateSlug(body.nameEs)

  const { count } = await client
    .from('equipment')
    .select('*', { count: 'exact', head: true })
    .eq('slug', slug)
    .is('deleted_at', null)

  if (count && count > 0)
    throw createError({
      statusCode: 409,
      statusMessage: 'Ya existe un equipamiento con este nombre',
    })

  const { data, error } = await client
    .from('equipment')
    .insert({
      name_es: body.nameEs,
      name_en: body.nameEn,
      slug,
    })
    .select()
    .single()

  if (error || !data)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al crear el equipamiento',
    })

  const equipment = equipmentSchema.parse(toCamelCase(data))

  return equipment
})
