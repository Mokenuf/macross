import type { CreateRoutine, Routine } from '@macross/shared'
import { createRoutineSchema, routineSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event): Promise<Routine> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const body = await readValidatedBody<CreateRoutine>(event, createRoutineSchema.parse)
  const client = await serverSupabaseClient(event)

  const routineId = crypto.randomUUID()

  const { dayRows, blockRows, slotRows, schemeRows } = buildRoutineTree(body, routineId)

  const { data: created, error: routineError } = await client
    .from('routines')
    .insert({
      id: routineId,
      trainer_id: user.sub,
      client_id: body.clientId ?? null,
      name: body.name,
      days_per_week: body.daysPerWeek,
      weeks: body.weeks,
      notes: body.notes ?? null,
      is_template: body.isTemplate,
    })
    .select()
    .single()

  if (routineError) {
    // Índice único parcial routines_one_active_per_client: una rutina activa por cliente.
    if (routineError.code === '23505')
      throw createError({ statusCode: 409, statusMessage: 'El cliente ya tiene una rutina activa' })
    throw createError({
      statusCode: 500,
      statusMessage: routineError.message ?? 'Error al crear la rutina',
    })
  }

  // Rollback compensatorio: el cascade de la FK limpia todo el árbol ya insertado.
  async function abort(message: string): Promise<never> {
    await client.from('routines').delete().eq('id', routineId)
    throw createError({ statusCode: 500, statusMessage: message })
  }

  const { error: daysError } = await client.from('routine_days').insert(dayRows)
  if (daysError) await abort(daysError.message ?? 'Error al crear los días')

  const { error: blocksError } = await client.from('routine_blocks').insert(blockRows)
  if (blocksError) await abort(blocksError.message ?? 'Error al crear los bloques')

  const { error: slotsError } = await client.from('routine_exercises').insert(slotRows)
  if (slotsError) await abort(slotsError.message ?? 'Error al crear los ejercicios')

  const { error: schemesError } = await client.from('routine_exercise_schemes').insert(schemeRows)
  if (schemesError) await abort(schemesError.message ?? 'Error al crear la prescripción')

  const routine = routineSchema.parse(toCamelCase<Routine>(created))

  return routine
})
