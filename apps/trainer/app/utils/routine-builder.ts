import type { BuilderDay, BuilderExercise, BuilderScheme } from '@/components/routines/types'

// Lo ya entrenado no se toca, y el server aplica la misma regla en el PATCH: si una celda bloqueada
// se ofreciera editable, el cambio se descartaría en silencio.
export function isSchemeLocked(scheme: BuilderScheme, startWeek: number) {
  return scheme.weekNumber < startWeek || scheme.trainedSets > 0
}

// Solo se exigen las celdas que el server va a escribir: una bloqueada no viaja, así que pedirle
// datos deja el guardado trabado sin forma de destrabarlo.
export function isDayComplete(day: BuilderDay, startWeek: number) {
  return (
    day.exercises.length > 0 &&
    day.exercises.every(
      exercise =>
        exercise.exercise &&
        exercise.schemes
          .filter(scheme => !isSchemeLocked(scheme, startWeek))
          .every(scheme => scheme.reps.trim().length > 0 && scheme.sets >= 1),
    )
  )
}

// El clon es un slot nuevo: sin id (con el del original, el diff creería que las dos filas son la
// misma y una de las dos perdería su ejercicio) y sin prescripción para las semanas ya cerradas.
function cloneExercise(exercise: BuilderExercise, startWeek: number): BuilderExercise {
  return {
    exercise: exercise.exercise ? { ...exercise.exercise } : null,
    optional: exercise.optional,
    notes: exercise.notes,
    schemes: exercise.schemes
      .filter(scheme => scheme.weekNumber >= startWeek)
      .map(scheme => ({
        weekNumber: scheme.weekNumber,
        sets: scheme.sets,
        reps: scheme.reps,
        restSeconds: scheme.restSeconds,
        notes: scheme.notes,
        trainedSets: 0,
      })),
  }
}

export function cloneDay(day: BuilderDay, startWeek: number): BuilderDay {
  return {
    label: day.label,
    exercises: day.exercises.map(exercise => cloneExercise(exercise, startWeek)),
  }
}

// Duplicar cae en el próximo día vacío en vez de empujar uno nuevo: el wizard ya creó N días con la
// cantidad elegida, así que apilar al final subiría los días por semana sin que nadie lo pida.
export function nextEmptyDayIndex(days: BuilderDay[], after: number) {
  return days.findIndex((day, i) => i > after && day.exercises.length === 0)
}
