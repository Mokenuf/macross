import type { Routine, RoutineBlock, RoutineDay, RoutineExercise } from '@macross/shared'

// Un ejercicio sin prescripción para esa semana no pertenece a esa semana: no se muestra ni la
// traba. Es lo que deja que un ejercicio cambiado a mitad de fase arranque en la semana en curso
// sin volver "incompletas" las semanas que el cliente ya cerró.
export function weekBlocks(day: RoutineDay, week: number) {
  return day.blocks
    .filter(block => blockSchemeForWeek(block, week))
    .map(block => ({
      ...block,
      exercises: block.exercises.filter(exercise => schemeForWeek(exercise, week)),
    }))
    .filter(block => block.exercises.length > 0)
}

export function dayExercises(day: RoutineDay, week: number) {
  return weekBlocks(day, week).flatMap(block => block.exercises)
}

// Sin fallback a otra semana: los logs irían contra sus filas y le pisarían el historial.
export function schemeForWeek(exercise: RoutineExercise, week: number) {
  return exercise.schemes.find(scheme => scheme.weekNumber === week) ?? null
}

export function blockSchemeForWeek(block: RoutineBlock, week: number) {
  return block.schemes.find(scheme => scheme.weekNumber === week) ?? null
}

// Una fila de log por serie (índice único), así que contar las completadas alcanza.
export function completedSetCount(exercise: RoutineExercise, week: number) {
  return schemeForWeek(exercise, week)?.logs?.filter(log => log.completed).length ?? 0
}

export function isExerciseDone(block: RoutineBlock, exercise: RoutineExercise, week: number) {
  const rounds = blockSchemeForWeek(block, week)
  return (
    !!rounds && !!schemeForWeek(exercise, week) && completedSetCount(exercise, week) >= rounds.sets
  )
}

export function isDayDone(day: RoutineDay, week: number) {
  const slots = weekBlocks(day, week).flatMap(block =>
    block.exercises.map(exercise => ({ block, exercise })),
  )
  if (!slots.length) return true

  // Un opcional sin hacer no traba el día; si fueran todos opcionales, nacería "completado".
  const required = slots.filter(({ exercise }) => !exercise.optional)
  return (required.length ? required : slots).every(({ block, exercise }) =>
    isExerciseDone(block, exercise, week),
  )
}

export function isWeekDone(routine: Routine | null | undefined, week: number) {
  const days = routine?.days
  return !!days?.length && days.every(day => isDayDone(day, week))
}

// La fase es una cola de sesiones por (semana, día) y la posición es la primera sin completar.
export function findPlanCursor(routine: Routine | null | undefined) {
  const days = routine?.days
  if (!routine || !days?.length) return null

  for (let week = 1; week <= routine.weeks; week++) {
    for (const day of days) {
      if (!isDayDone(day, week)) return { week, day }
    }
  }

  return null
}

export type SessionStep = { block: RoutineBlock; exercise: RoutineExercise; set: number }

// El día se recorre por ronda, no por ejercicio: en una superserie A+B, A₁ → B₁ → A₂ → B₂.
export function sessionSteps(day: RoutineDay, week: number): SessionStep[] {
  return weekBlocks(day, week).flatMap(block => {
    const rounds = blockSchemeForWeek(block, week)?.sets ?? 0
    return Array.from({ length: rounds }, (_, i) =>
      block.exercises.map(exercise => ({ block, exercise, set: i + 1 })),
    ).flat()
  })
}

export function isStepDone(step: SessionStep, week: number) {
  return !!schemeForWeek(step.exercise, week)?.logs?.some(
    log => log.setNumber === step.set && log.completed,
  )
}

// Hacia adelante y recién después desde el principio: un paso salteado no vuelve tras cada serie.
export function nextPendingStep(
  steps: SessionStep[],
  week: number,
  after?: { slotId: string; set: number },
) {
  const from = after
    ? steps.findIndex(step => step.exercise.id === after.slotId && step.set === after.set)
    : -1
  const ordered = [...steps.slice(from + 1), ...steps.slice(0, from + 1)]

  return ordered.find(step => !isStepDone(step, week)) ?? null
}

// Dentro de la ronda va la transición (null = directo); al cerrarla, el descanso.
export function pauseAfter(current: SessionStep, next: SessionStep | null, week: number) {
  const rounds = blockSchemeForWeek(current.block, week)
  const sameRound = !!next && next.block.id === current.block.id && next.set === current.set

  return sameRound
    ? { kind: 'transition' as const, seconds: rounds?.transitionSeconds ?? null }
    : { kind: 'rest' as const, seconds: rounds?.restSeconds ?? null }
}
