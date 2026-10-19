import type { Unit, UpdateUnit } from '@macross/shared'
import { unitSchema, updateUnitSchema } from '@macross/shared'

import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Unit> => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug is required' })

  const body = await readValidatedBody<UpdateUnit>(event, updateUnitSchema.parse)
  const client = await serverSupabaseClient(event)

  const { data: current, error: findError } = await client
    .from('units')
    .select('id, is_default')
    .eq('slug', slug)
    .is('deleted_at', null)
    .maybeSingle()

  if (findError) throw createError({ statusCode: 500, statusMessage: findError.message })
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Unidad no encontrada' })

  if (current.is_default && !body.isDefault)
    throw createError({
      statusCode: 409,
      statusMessage: 'Para cambiar la unidad por defecto, marcá otra como default',
    })

  const newSlug = generateSlug(body.nameEs)

  if (newSlug !== slug) {
    const { count } = await client
      .from('units')
      .select('*', { count: 'exact', head: true })
      .eq('slug', newSlug)
      .is('deleted_at', null)
    if (count && count > 0)
      throw createError({
        statusCode: 409,
        statusMessage: 'Ya existe una unidad con este nombre',
      })
  }

  const { data, error } = await client
    .from('units')
    .update({
      name_es: body.nameEs,
      name_en: body.nameEn,
      kind: body.kind,
      slug: newSlug,
    })
    .eq('id', current.id)
    .select()
    .single()

  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al actualizar la unidad',
    })

  if (body.isDefault && !current.is_default) await setDefaultUnit(event, current.id)

  const unit = unitSchema.parse({ ...toCamelCase<Unit>(data), isDefault: body.isDefault })

  return unit
})
