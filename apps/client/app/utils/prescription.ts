import type { RoutineExerciseScheme } from '@macross/shared'
import { UnitKinds, type UnitKind } from '@macross/shared'

export function formatSeconds(seconds: number) {
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`
}

// La cantidad es texto libre ("6-8", "12 + 20", "al fallo"): la unidad solo se nombra cuando hay
// un número que medir. Una unidad `time` se mide siempre en segundos.
export function formatAmount(value: string, unitName: string, kind: UnitKind) {
  const amount = value.trim()
  if (!/\d/.test(amount)) return amount
  if (kind === UnitKinds.time) {
    return /^\d+$/.test(amount) ? formatSeconds(Number(amount)) : `${amount} s`
  }
  return `${amount} ${unitName.toLocaleLowerCase()}`
}

export function repsForSet(scheme: Pick<RoutineExerciseScheme, 'reps' | 'setReps'>, set: number) {
  return scheme.setReps?.[set - 1] ?? scheme.reps
}
