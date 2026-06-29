import { CreateMuscleGroup, createMuscleGroupSchema, muscleGroupSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async event => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const body = await readValidatedBody<CreateMuscleGroup>(event, createMuscleGroupSchema.parse)
  const client = await serverSupabaseClient(event)

  const slug = generateSlug(body.nameEs)

  const { count } = await client
    .from('muscle_groups')
    .select('*', { count: 'exact', head: true })
    .eq('slug', slug)
    .is('deleted_at', null)

  if (count && count > 0)
    throw createError({
      statusCode: 409,
      statusMessage: 'Ya existe un grupo muscular con este nombre',
    })

  const { data, error } = await client
    .from('muscle_groups')
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
      statusMessage: error?.message ?? 'Error al crear el grupo muscular',
    })

  const muscleGroup = muscleGroupSchema.parse(toCamelCase(data))

  return muscleGroup
})
