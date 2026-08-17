import type { Routine, UpdateRoutine } from '@macross/shared'
import { routineSchema, updateRoutineSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

const oldTreeSelect = `
  id,
  days:routine_days(
    id, day_number, label,
    blocks:routine_blocks(
      id, type, sort_order, notes,
      exercises:routine_exercises(
        id, exercise_id, optional, notes,
        schemes:routine_exercise_schemes(
          id, week_number, sets, reps, rest_seconds, notes,
          logs:workout_logs(completed, deleted_at)
        )
      )
    )
  )
`

export default defineEventHandler(async (event): Promise<Routine> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const nanoId = getRouterParam(event, 'nanoId')
  if (!nanoId) throw createError({ statusCode: 400, statusMessage: 'Falta el identificador' })

  const body = await readValidatedBody<UpdateRoutine>(event, updateRoutineSchema.parse)
  const client = await serverSupabaseClient(event)

  const { data: existing, error: fetchError } = await client
    .from('routines')
    .select(oldTreeSelect)
    .eq('nano_id', nanoId)
    .is('deleted_at', null)
    .is('days.deleted_at', null)
    .is('days.blocks.deleted_at', null)
    .is('days.blocks.exercises.deleted_at', null)
    .order('day_number', { referencedTable: 'days' })
    .order('sort_order', { referencedTable: 'days.blocks' })
    .single()

  if (fetchError || !existing) {
    throw createError({ statusCode: 404, statusMessage: 'Rutina no encontrada' })
  }

  const old = toCamelCase<OldRoutineTree>(existing)
  const startWeek = findStartWeek(old, body.weeks)
  const plan = diffRoutineTree(body, old, startWeek)

  async function run(label: string, op: PromiseLike<{ error: { message?: string } | null }>) {
    const { error } = await op
    if (error) throw createError({ statusCode: 500, statusMessage: error.message ?? label })
  }

  // Los escalares van primero porque son lo único que puede fallar por conflicto (23505 al reasignar
  // a un cliente que ya tiene activa): si revienta, el árbol todavía no se tocó.
  const { data: updated, error: updateError } = await client
    .from('routines')
    .update({
      name: body.name,
      client_id: body.clientId ?? null,
      days_per_week: body.daysPerWeek,
      weeks: body.weeks,
      notes: body.notes ?? null,
      is_template: body.isTemplate,
    })
    .eq('id', old.id)
    .select()
    .single()

  if (updateError || !updated) {
    if (updateError?.code === '23505')
      throw createError({ statusCode: 409, statusMessage: 'El cliente ya tiene una rutina activa' })
    throw createError({
      statusCode: 500,
      statusMessage: updateError?.message ?? 'Error al actualizar la rutina',
    })
  }

  if (plan.blockTempShift.length)
    await run(
      'Error al reordenar los bloques',
      client.from('routine_blocks').upsert(plan.blockTempShift),
    )

  if (plan.dayInserts.length)
    await run('Error al crear los días', client.from('routine_days').insert(plan.dayInserts))

  if (plan.blockInserts.length)
    await run('Error al crear los bloques', client.from('routine_blocks').insert(plan.blockInserts))

  if (plan.slotInserts.length)
    await run(
      'Error al crear los ejercicios',
      client.from('routine_exercises').insert(plan.slotInserts),
    )

  if (plan.schemeInserts.length)
    await run(
      'Error al crear la prescripción',
      client.from('routine_exercise_schemes').insert(plan.schemeInserts),
    )

  if (plan.blockUpdates.length)
    await run(
      'Error al reordenar los bloques',
      client.from('routine_blocks').upsert(plan.blockUpdates),
    )

  // Retiro al final: hasta acá todo lo nuevo ya existe, así que una falla deja duplicados visibles
  // (recuperable volviendo a guardar) en vez de un día sin ejercicios.
  const now = new Date().toISOString()
  if (plan.retireSlotIds.length)
    await run(
      'Error al retirar ejercicios',
      client.from('routine_exercises').update({ deleted_at: now }).in('id', plan.retireSlotIds),
    )
  if (plan.retireBlockIds.length)
    await run(
      'Error al retirar bloques',
      client.from('routine_blocks').update({ deleted_at: now }).in('id', plan.retireBlockIds),
    )
  if (plan.retireDayIds.length)
    await run(
      'Error al retirar días',
      client.from('routine_days').update({ deleted_at: now }).in('id', plan.retireDayIds),
    )

  if (plan.dayUpdates.length)
    await run('Error al actualizar los días', client.from('routine_days').upsert(plan.dayUpdates))

  if (plan.slotUpdates.length)
    await run(
      'Error al actualizar los ejercicios',
      client.from('routine_exercises').upsert(plan.slotUpdates),
    )

  if (plan.schemeUpdates.length)
    await run(
      'Error al actualizar la prescripción',
      client.from('routine_exercise_schemes').upsert(plan.schemeUpdates),
    )

  const routine = routineSchema.parse(toCamelCase<Routine>(updated))

  return routine
})
