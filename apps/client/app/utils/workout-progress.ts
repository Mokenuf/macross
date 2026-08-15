import type { RoutineExercise } from '@macross/shared'

// Semana fija en 1: todavía no existe el cursor de semana en curso.
export function currentScheme(exercise: RoutineExercise) {
  return exercise.schemes.find(scheme => scheme.weekNumber === 1) ?? exercise.schemes[0] ?? null
}

// Una fila de log por serie (índice único), así que contar las completadas alcanza.
export function completedSetCount(exercise: RoutineExercise) {
  return currentScheme(exercise)?.logs?.filter(log => log.completed).length ?? 0
}

export function isExerciseDone(exercise: RoutineExercise) {
  const scheme = currentScheme(exercise)
  return !!scheme && completedSetCount(exercise) >= scheme.sets
}
