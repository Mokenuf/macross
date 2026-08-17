import type { CreateRoutine } from '@macross/shared'

// Los ids se generan acá para correlacionar padre↔hijo sin depender del orden de vuelta de los
// batch inserts.
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

  const blocks = days.flatMap(d =>
    d.day.blocks.map((block, j) => ({
      id: crypto.randomUUID(),
      dayId: d.id,
      sortOrder: j,
      block,
    })),
  )

  const blockRows = blocks.map(b => ({
    id: b.id,
    routine_day_id: b.dayId,
    type: b.block.type,
    sort_order: b.sortOrder,
    notes: b.block.notes ?? null,
  }))

  const slots = blocks.flatMap(b =>
    b.block.exercises.map((exercise, k) => ({
      id: crypto.randomUUID(),
      blockId: b.id,
      sortOrder: k,
      exercise,
    })),
  )

  const slotRows = slots.map(s => ({
    id: s.id,
    routine_block_id: s.blockId,
    exercise_id: s.exercise.exerciseId,
    sort_order: s.sortOrder,
    optional: s.exercise.optional,
    notes: s.exercise.notes ?? null,
  }))

  // Se recorre el rango de semanas y se busca la prescripción, en vez de mapear el array del body:
  // así una semana fuera de rango o repetida no puede llegar a la DB sin validarla en el schema.
  const schemeRows = slots.flatMap(s =>
    Array.from({ length: body.weeks }, (_, w) => w + 1).flatMap(week => {
      const scheme = s.exercise.schemes.find(candidate => candidate.weekNumber === week)
      if (!scheme) return []

      return {
        routine_exercise_id: s.id,
        week_number: week,
        sets: scheme.sets,
        reps: scheme.reps,
        rest_seconds: scheme.restSeconds ?? null,
        notes: scheme.notes ?? null,
      }
    }),
  )

  return { dayRows, blockRows, slotRows, schemeRows }
}
