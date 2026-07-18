import type { CreateRoutine } from '@macross/shared'

// Desarme del builder flat → árbol: cada ejercicio del día es un bloque `single` con un único
// slot, y su prescripción se replica en N schemes idénticas (una por semana). Los ids se generan
// acá para correlacionar padre↔hijo sin depender del orden de vuelta de los batch inserts.
export function buildRoutineTree(body: CreateRoutine, routineId: string) {
  const days = body.days.map((day, i) => ({
    id: crypto.randomUUID(),
    dayNumber: i + 1,
    day,
  }))

  const dayRows = days.map(d => ({
    id: d.id,
    routine_id: routineId,
    day_number: d.dayNumber,
    label: d.day.label ?? null,
  }))

  const slots = days.flatMap(d =>
    d.day.exercises.map((exercise, j) => ({
      blockId: crypto.randomUUID(),
      slotId: crypto.randomUUID(),
      dayId: d.id,
      sortOrder: j,
      exercise,
    })),
  )

  const blockRows = slots.map(s => ({
    id: s.blockId,
    routine_day_id: s.dayId,
    type: 'single' as const,
    sort_order: s.sortOrder,
    notes: null,
  }))

  const slotRows = slots.map(s => ({
    id: s.slotId,
    routine_block_id: s.blockId,
    exercise_id: s.exercise.exerciseId,
    sort_order: 0,
    optional: s.exercise.optional,
    notes: s.exercise.notes ?? null,
  }))

  const schemeRows = slots.flatMap(s =>
    Array.from({ length: body.weeks }, (_, w) => ({
      routine_exercise_id: s.slotId,
      week_number: w + 1,
      sets: s.exercise.sets,
      reps: s.exercise.reps,
      rest_seconds: s.exercise.restSeconds ?? null,
      notes: null,
    })),
  )

  return { dayRows, blockRows, slotRows, schemeRows }
}
