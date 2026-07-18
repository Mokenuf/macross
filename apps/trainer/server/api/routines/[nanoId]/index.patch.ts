import type { Routine, UpdateRoutine } from '@macross/shared'
import { routineSchema, updateRoutineSchema } from '@macross/shared'

import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

// Ids internos del árbol viejo a retirar. La query cruda sale `any` (el auto-tipado de Database de
// @nuxtjs/supabase no aguanta el typecheck — bug nuxt-modules/supabase#535), así que afirmamos el
// shape con toCamelCase como en toda la codebase. No es contrato al cliente → sin Zod.
type OldTree = {
  id: string
  routineDays: {
    id: string
    routineBlocks: { id: string; routineExercises: { id: string }[] }[]
  }[]
}

export default defineEventHandler(async (event): Promise<Routine> => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'No autenticado' })

  const nanoId = getRouterParam(event, 'nanoId')
  if (!nanoId) throw createError({ statusCode: 400, statusMessage: 'Falta el identificador' })

  const body = await readValidatedBody<UpdateRoutine>(event, updateRoutineSchema.parse)
  const client = await serverSupabaseClient(event)

  // Ids del árbol viejo (vivos) para retirarlo tras insertar el nuevo. RLS gatea la pertenencia.
  const { data: existing, error: fetchError } = await client
    .from('routines')
    .select('id, routine_days(id, routine_blocks(id, routine_exercises(id)))')
    .eq('nano_id', nanoId)
    .is('deleted_at', null)
    .is('routine_days.deleted_at', null)
    .is('routine_days.routine_blocks.deleted_at', null)
    .is('routine_days.routine_blocks.routine_exercises.deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw createError({ statusCode: 404, statusMessage: 'Rutina no encontrada' })
  }

  const tree = toCamelCase<OldTree>(existing)
  const oldDayIds = tree.routineDays.map(d => d.id)
  const oldBlockIds = tree.routineDays.flatMap(d => d.routineBlocks.map(b => b.id))
  const oldSlotIds = tree.routineDays.flatMap(d =>
    d.routineBlocks.flatMap(b => b.routineExercises.map(s => s.id)),
  )

  const { dayRows, blockRows, slotRows, schemeRows } = buildRoutineTree(body, tree.id)
  const newDayIds = dayRows.map(d => d.id)

  // Rollback del árbol nuevo (recién insertado, aún sin logs): el cascade limpia todo lo colgado.
  // La rutina vieja queda intacta porque todavía no la retiramos.
  async function abortNewTree(statusCode: number, message: string): Promise<never> {
    await client.from('routine_days').delete().in('id', newDayIds)
    throw createError({ statusCode, statusMessage: message })
  }

  const { error: daysError } = await client.from('routine_days').insert(dayRows)
  if (daysError) await abortNewTree(500, daysError.message ?? 'Error al crear los días')

  const { error: blocksError } = await client.from('routine_blocks').insert(blockRows)
  if (blocksError) await abortNewTree(500, blocksError.message ?? 'Error al crear los bloques')

  const { error: slotsError } = await client.from('routine_exercises').insert(slotRows)
  if (slotsError) await abortNewTree(500, slotsError.message ?? 'Error al crear los ejercicios')

  const { error: schemesError } = await client.from('routine_exercise_schemes').insert(schemeRows)
  if (schemesError)
    await abortNewTree(500, schemesError.message ?? 'Error al crear la prescripción')

  // Escalares: última operación reversible antes del cutover. Si falla (ej: 23505 al reasignar a
  // un cliente que ya tiene rutina activa), se revierte el árbol nuevo y la vieja queda intacta.
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
    .eq('id', tree.id)
    .select()
    .single()

  if (updateError || !updated) {
    if (updateError?.code === '23505')
      await abortNewTree(409, 'El cliente ya tiene una rutina activa')
    await abortNewTree(500, updateError?.message ?? 'Error al actualizar la rutina')
  }

  // Retiro del árbol viejo (soft-delete). Los días al final = cutover atómico de visibilidad (el
  // read filtra days.deleted_at). Las schemes viejas NO se tocan: sostienen los workout_logs.
  const now = new Date().toISOString()
  if (oldSlotIds.length > 0)
    await client.from('routine_exercises').update({ deleted_at: now }).in('id', oldSlotIds)
  if (oldBlockIds.length > 0)
    await client.from('routine_blocks').update({ deleted_at: now }).in('id', oldBlockIds)
  if (oldDayIds.length > 0)
    await client.from('routine_days').update({ deleted_at: now }).in('id', oldDayIds)

  const routine = routineSchema.parse(toCamelCase<Routine>(updated))

  return routine
})
