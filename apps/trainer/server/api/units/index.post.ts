import type { CreateUnit, Unit } from '@macross/shared'
import { createUnitSchema, unitSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async event => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const body = await readValidatedBody<CreateUnit>(event, createUnitSchema.parse)
  const client = await serverSupabaseClient(event)

  const slug = generateSlug(body.nameEs)

  const { count } = await client
    .from('units')
    .select('*', { count: 'exact', head: true })
    .eq('slug', slug)
    .is('deleted_at', null)

  if (count && count > 0)
    throw createError({
      statusCode: 409,
      statusMessage: 'Ya existe una unidad con este nombre',
    })

  const { data, error } = await client
    .from('units')
    .insert({
      name_es: body.nameEs,
      name_en: body.nameEn,
      kind: body.kind,
      slug,
    })
    .select()
    .single()

  if (error || !data)
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? 'Error al crear la unidad',
    })

  if (body.isDefault) await setDefaultUnit(event, data.id)

  const unit = unitSchema.parse({ ...toCamelCase<Unit>(data), isDefault: body.isDefault })

  return unit
})
