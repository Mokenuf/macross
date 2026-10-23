import type { BlockType, UnitRef } from '@macross/shared'

// createRoutineSchema solo lleva exerciseId; el builder guarda el ref del ejercicio para mostrar el nombre.

export interface BuilderExerciseRef {
  id: string
  nameEs: string
  nameEn: string | null
  unit: UnitRef
}

export interface BuilderScheme {
  weekNumber: number
  reps: string
  setReps: string[] | null
  notes: string
  // Series que el cliente ya entrenó en esta semana: es lo que cierra la celda (el server tampoco
  // la reescribe). Es un dato del árbol, no un veredicto de UI — el bloqueo se deriva en el componente.
  trainedSets: number
}

export interface BuilderExercise {
  id?: string
  exercise: BuilderExerciseRef | null
  optional: boolean
  notes: string
  schemes: BuilderScheme[]
}

// `transitionSeconds` null = pasar directo al siguiente ejercicio de la ronda.
export interface BuilderBlockScheme {
  weekNumber: number
  sets: number
  restSeconds: number | null
  transitionSeconds: number | null
}

export interface BuilderBlock {
  id?: string
  type: BlockType
  notes: string
  schemes: BuilderBlockScheme[]
  exercises: BuilderExercise[]
}

export interface BuilderDay {
  id?: string
  label: string
  blocks: BuilderBlock[]
}

export interface RoutineBuilderState {
  name: string
  clientId: string
  weeks: number
  notes: string
  activate: boolean
  days: BuilderDay[]
}
