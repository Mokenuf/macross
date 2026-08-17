import type { Routine, RoutineDay, RoutineExercise } from '@macross/shared'

// Un ejercicio sin prescripción para esa semana no pertenece a esa semana: no se muestra ni la
// traba. Es lo que deja que un ejercicio cambiado a mitad de fase arranque en la semana en curso
// sin volver "incompletas" las semanas que el cliente ya cerró.
export function weekBlocks(day: RoutineDay, week: number) {
  return day.blocks
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

// Una fila de log por serie (índice único), así que contar las completadas alcanza.
export function completedSetCount(exercise: RoutineExercise, week: number) {
  return schemeForWeek(exercise, week)?.logs?.filter(log => log.completed).length ?? 0
}

export function isExerciseDone(exercise: RoutineExercise, week: number) {
  const scheme = schemeForWeek(exercise, week)
  return !!scheme && completedSetCount(exercise, week) >= scheme.sets
}

export function isDayDone(day: RoutineDay, week: number) {
  const exercises = dayExercises(day, week)
  if (!exercises.length) return true

  // Un opcional sin hacer no traba el día; si fueran todos opcionales, nacería "completado".
  const required = exercises.filter(exercise => !exercise.optional)
  return (required.length ? required : exercises).every(exercise => isExerciseDone(exercise, week))
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
