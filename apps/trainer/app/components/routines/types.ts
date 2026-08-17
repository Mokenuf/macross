// createRoutineSchema solo lleva exerciseId; el builder guarda el ref del ejercicio para mostrar el nombre.

export interface BuilderExerciseRef {
  id: string
  nameEs: string
  nameEn: string | null
}

export interface BuilderScheme {
  weekNumber: number
  sets: number
  reps: string
  restSeconds: number | null
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

export interface BuilderDay {
  id?: string
  label: string
  exercises: BuilderExercise[]
}

export interface RoutineBuilderState {
  name: string
  clientId: string
  weeks: number
  notes: string
  activate: boolean
  days: BuilderDay[]
}
