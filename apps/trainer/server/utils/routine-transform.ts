import type { Routine } from '@macross/shared'

// El árbol se embebe con los logs porque el server los necesita para derivar la semana en curso,
// pero el builder solo cuenta las series hechas para bloquear la celda: se sirve el conteo y los
// logs no salen. Muta el resultado del parse (objeto recién creado, sin otros dueños) para no
// reconstruir cuatro niveles de spreads.
export function toRoutineResponse(routine: Routine): Routine {
  for (const day of routine.days ?? []) {
    for (const block of day.blocks) {
      for (const slot of block.exercises) {
        for (const scheme of slot.schemes) {
          scheme.trainedSets = (scheme.logs ?? []).filter(log => log.completed).length
          delete scheme.logs
        }
      }
    }
  }

  return routine
}
