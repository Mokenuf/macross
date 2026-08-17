import type { UpdateRoutine } from '@macross/shared'

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

// Los sort_order de bloque se reasignan en dos pasadas contra el índice único parcial
// (routine_day_id, sort_order) where deleted_at is null: Postgres lo chequea fila por fila, así que
// mover A→1 mientras B sigue en 1 explota. Esta base saca a todos los vivos del rango final primero.
const TEMP_SORT_BASE = 1000

function schemeForWeek(slot: OldSlot, week: number) {
  return slot.schemes.find(scheme => scheme.weekNumber === week) ?? null
}

// Un ejercicio sin prescripción para esa semana no pertenece a esa semana: no la traba. Es lo que
// deja que un ejercicio cambiado a mitad de fase arranque en la semana en curso sin volver
// "incompletas" las semanas que el cliente ya cerró. Espejo de isDayDone en apps/client.
function isOldDayDone(day: OldDay, week: number) {
  const slots = day.blocks
    .flatMap(block => block.exercises)
    .filter(slot => schemeForWeek(slot, week))

  if (!slots.length) return true

  const required = slots.filter(slot => !slot.optional)

  return (required.length ? required : slots).every(slot => {
    const scheme = schemeForWeek(slot, week)!
    const done = (scheme.logs ?? []).filter(log => log.completed && !log.deletedAt).length
    return done >= scheme.sets
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
  const oldSlots = new Map<string, { slot: OldSlot; block: OldBlock }>()
  for (const day of old.days)
    for (const block of day.blocks)
      for (const slot of block.exercises) oldSlots.set(slot.id, { slot, block })

  const keptDayIds = new Set<string>()
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

    day.exercises.forEach((exercise, sortOrder) => {
      const existing = exercise.id ? oldSlots.get(exercise.id) : undefined

      // Cambiar el ejercicio de un slot re-apuntaría sus logs viejos a otro ejercicio: se retira el
      // slot (conserva sus schemes y su historial) y nace uno nuevo desde la semana en curso.
      if (!existing || existing.slot.exerciseId !== exercise.exerciseId) {
        const blockId = crypto.randomUUID()
        const slotId = crypto.randomUUID()

        blockInserts.push({
          id: blockId,
          routine_day_id: dayId,
          type: 'single',
          sort_order: sortOrder,
          notes: null,
        })
        slotInserts.push({
          id: slotId,
          routine_block_id: blockId,
          exercise_id: exercise.exerciseId,
          sort_order: 0,
          optional: exercise.optional,
          notes: exercise.notes ?? null,
        })
        for (let week = startWeek; week <= body.weeks; week++) {
          schemeInserts.push({
            routine_exercise_id: slotId,
            week_number: week,
            sets: exercise.sets,
            reps: exercise.reps,
            rest_seconds: exercise.restSeconds ?? null,
            notes: null,
          })
        }
        return
      }

      keptSlotIds.add(existing.slot.id)

      blockUpdates.push({
        id: existing.block.id,
        routine_day_id: dayId,
        type: existing.block.type,
        sort_order: sortOrder,
        notes: existing.block.notes,
      })
      slotUpdates.push({
        id: existing.slot.id,
        routine_block_id: existing.block.id,
        exercise_id: existing.slot.exerciseId,
        sort_order: 0,
        optional: exercise.optional,
        notes: exercise.notes ?? null,
      })

      // La prescripción de las semanas ya transitadas no se toca: es lo que el cliente entrenó.
      for (let week = startWeek; week <= body.weeks; week++) {
        const scheme = schemeForWeek(existing.slot, week)
        const values = {
          routine_exercise_id: existing.slot.id,
          week_number: week,
          sets: exercise.sets,
          reps: exercise.reps,
          rest_seconds: exercise.restSeconds ?? null,
        }

        if (scheme) schemeUpdates.push({ ...values, id: scheme.id, notes: scheme.notes })
        else schemeInserts.push({ ...values, notes: null })
      }
    })
  })

  const retireDayIds: string[] = []
  const retireBlockIds: string[] = []
  const retireSlotIds: string[] = []

  for (const day of old.days) {
    if (!keptDayIds.has(day.id)) retireDayIds.push(day.id)
    for (const block of day.blocks) {
      if (!block.exercises.some(slot => keptSlotIds.has(slot.id))) retireBlockIds.push(block.id)
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

  return {
    blockTempShift,
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
