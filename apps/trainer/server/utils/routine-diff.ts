import type { UpdateRoutine, UpdateRoutineExercise } from '@macross/shared'

export type OldLog = { completed: boolean; deletedAt?: string | null }

export type OldScheme = {
  id: string
  weekNumber: number
  sets: number
  reps: string
  restSeconds: number | null
  notes: string | null
  logs?: OldLog[] | null
}

export type OldSlot = {
  id: string
  exerciseId: string
  optional: boolean
  notes: string | null
  schemes: OldScheme[]
}

export type OldBlock = {
  id: string
  type: string
  sortOrder: number
  notes: string | null
  exercises: OldSlot[]
}

export type OldDay = {
  id: string
  dayNumber: number
  label: string | null
  blocks: OldBlock[]
}

export type OldRoutineTree = { id: string; days: OldDay[] }

type DayRow = { id: string; routine_id: string; day_number: number; label: string | null }

type BlockRow = {
  id: string
  routine_day_id: string
  type: string
  sort_order: number
  notes: string | null
}

type SlotRow = {
  id: string
  routine_block_id: string
  exercise_id: string
  sort_order: number
  optional: boolean
  notes: string | null
}

type SchemeRow = {
  routine_exercise_id: string
  week_number: number
  sets: number
  reps: string
  rest_seconds: number | null
  notes: string | null
}

// Los sort_order se reasignan en dos pasadas contra los índices únicos parciales de bloque
// (routine_day_id, sort_order) y de slot (routine_block_id, sort_order): Postgres los chequea fila
// por fila, así que mover A→1 mientras B sigue en 1 explota. Esta base saca a todos los vivos del
// rango final primero, y de paso libera el rango para las filas nuevas.
const TEMP_SORT_BASE = 1000

function trainedSetCount(scheme: OldScheme) {
  return (scheme.logs ?? []).filter(log => log.completed && !log.deletedAt).length
}

function oldSchemeForWeek(slot: OldSlot, week: number) {
  return slot.schemes.find(scheme => scheme.weekNumber === week) ?? null
}

function prescriptionForWeek(exercise: UpdateRoutineExercise, week: number) {
  return exercise.schemes.find(scheme => scheme.weekNumber === week) ?? null
}

// Un ejercicio sin prescripción para esa semana no pertenece a esa semana: no la traba. Es lo que
// deja que un ejercicio cambiado a mitad de fase arranque en la semana en curso sin volver
// "incompletas" las semanas que el cliente ya cerró. Espejo de isDayDone en apps/client.
function isOldDayDone(day: OldDay, week: number) {
  const slots = day.blocks
    .flatMap(block => block.exercises)
    .filter(slot => oldSchemeForWeek(slot, week))

  if (!slots.length) return true

  const required = slots.filter(slot => !slot.optional)

  return (required.length ? required : slots).every(slot => {
    const scheme = oldSchemeForWeek(slot, week)!
    return trainedSetCount(scheme) >= scheme.sets
  })
}

// La semana en curso: la primera sin cerrar. Todo lo que se agregue o cambie arranca acá, para que
// lo ya entrenado quede intacto. Sin logs da 1 (edición previa al arranque del cliente).
export function findStartWeek(old: OldRoutineTree, weeks: number) {
  for (let week = 1; week <= weeks; week++) {
    if (!old.days.every(day => isOldDayDone(day, week))) return week
  }

  return weeks
}

export function diffRoutineTree(body: UpdateRoutine, old: OldRoutineTree, startWeek: number) {
  const oldDays = new Map(old.days.map(day => [day.id, day]))
  const oldBlocks = new Map<string, OldBlock>()
  const oldSlots = new Map<string, OldSlot>()
  for (const day of old.days)
    for (const block of day.blocks) {
      oldBlocks.set(block.id, block)
      for (const slot of block.exercises) oldSlots.set(slot.id, slot)
    }

  const keptDayIds = new Set<string>()
  const keptBlockIds = new Set<string>()
  const keptSlotIds = new Set<string>()

  const dayInserts: DayRow[] = []
  const dayUpdates: DayRow[] = []
  const blockInserts: BlockRow[] = []
  const blockUpdates: BlockRow[] = []
  const slotInserts: SlotRow[] = []
  const slotUpdates: SlotRow[] = []
  const schemeInserts: SchemeRow[] = []
  const schemeUpdates: (SchemeRow & { id: string })[] = []

  body.days.forEach((day, dayIndex) => {
    const existingDay = day.id ? oldDays.get(day.id) : undefined
    const dayId = existingDay?.id ?? crypto.randomUUID()
    const dayRow = { id: dayId, day_number: dayIndex + 1, label: day.label ?? null }

    if (existingDay) {
      keptDayIds.add(dayId)
      dayUpdates.push({ ...dayRow, routine_id: old.id })
    } else {
      dayInserts.push({ ...dayRow, routine_id: old.id })
    }

    day.blocks.forEach((block, blockIndex) => {
      const existingBlock = block.id ? oldBlocks.get(block.id) : undefined
      const blockId = existingBlock?.id ?? crypto.randomUUID()
      const blockRow = {
        id: blockId,
        routine_day_id: dayId,
        type: block.type,
        sort_order: blockIndex,
        notes: block.notes ?? null,
      }

      if (existingBlock) {
        keptBlockIds.add(blockId)
        blockUpdates.push(blockRow)
      } else {
        blockInserts.push(blockRow)
      }

      block.exercises.forEach((exercise, sortOrder) => {
        const existing = exercise.id ? oldSlots.get(exercise.id) : undefined

        // Cambiar el ejercicio de un slot re-apuntaría sus logs viejos a otro ejercicio: se retira el
        // slot (conserva sus schemes y su historial) y nace uno nuevo desde la semana en curso.
        if (!existing || existing.exerciseId !== exercise.exerciseId) {
          const slotId = crypto.randomUUID()

          slotInserts.push({
            id: slotId,
            routine_block_id: blockId,
            exercise_id: exercise.exerciseId,
            sort_order: sortOrder,
            optional: exercise.optional,
            notes: exercise.notes ?? null,
          })
          for (let week = startWeek; week <= body.weeks; week++) {
            const prescription = prescriptionForWeek(exercise, week)
            if (!prescription) continue

            schemeInserts.push({
              routine_exercise_id: slotId,
              week_number: week,
              sets: prescription.sets,
              reps: prescription.reps,
              rest_seconds: prescription.restSeconds ?? null,
              notes: prescription.notes ?? null,
            })
          }
          return
        }

        keptSlotIds.add(existing.id)

        // Agrupar o desagrupar mueve el slot de bloque: es un update de routine_block_id y no un
        // retiro, así que los logs que cuelgan de sus schemes siguen visibles para el cliente.
        slotUpdates.push({
          id: existing.id,
          routine_block_id: blockId,
          exercise_id: existing.exerciseId,
          sort_order: sortOrder,
          optional: exercise.optional,
          notes: exercise.notes ?? null,
        })

        // La prescripción de las semanas ya transitadas no se toca: es lo que el cliente entrenó.
        for (let week = startWeek; week <= body.weeks; week++) {
          const prescription = prescriptionForWeek(exercise, week)
          // El builder no deja guardar con una semana incompleta, así que esto no debería pasar; si
          // pasa, la scheme vieja queda como está: sostiene workout_logs y no se puede borrar.
          if (!prescription) continue

          const scheme = oldSchemeForWeek(existing, week)
          // Lo ya entrenado no se toca, y se decide por celda y no por semana: con el picker de /plan
          // el cliente puede registrar series en cualquier semana, no solo en la que va transitando.
          if (scheme && trainedSetCount(scheme) > 0) continue
          const values = {
            routine_exercise_id: existing.id,
            week_number: week,
            sets: prescription.sets,
            reps: prescription.reps,
            rest_seconds: prescription.restSeconds ?? null,
            notes: prescription.notes ?? null,
          }

          if (scheme) schemeUpdates.push({ ...values, id: scheme.id })
          else schemeInserts.push(values)
        }
      })
    })
  })

  const retireDayIds: string[] = []
  const retireBlockIds: string[] = []
  const retireSlotIds: string[] = []

  for (const day of old.days) {
    if (!keptDayIds.has(day.id)) retireDayIds.push(day.id)
    for (const block of day.blocks) {
      if (!keptBlockIds.has(block.id)) retireBlockIds.push(block.id)
      for (const slot of block.exercises) if (!keptSlotIds.has(slot.id)) retireSlotIds.push(slot.id)
    }
  }

  const blockTempShift = old.days.flatMap((day, i) =>
    day.blocks.map((block, j) => ({
      id: block.id,
      routine_day_id: day.id,
      type: block.type,
      sort_order: TEMP_SORT_BASE + i * TEMP_SORT_BASE + j,
      notes: block.notes,
    })),
  )

  const slotTempShift = old.days.flatMap(day =>
    day.blocks.flatMap((block, i) =>
      block.exercises.map((slot, j) => ({
        id: slot.id,
        routine_block_id: block.id,
        exercise_id: slot.exerciseId,
        sort_order: TEMP_SORT_BASE + i * TEMP_SORT_BASE + j,
        optional: slot.optional,
        notes: slot.notes,
      })),
    ),
  )

  return {
    blockTempShift,
    slotTempShift,
    dayInserts,
    dayUpdates,
    blockInserts,
    blockUpdates,
    slotInserts,
    slotUpdates,
    schemeInserts,
    schemeUpdates,
    retireDayIds,
    retireBlockIds,
    retireSlotIds,
  }
}
