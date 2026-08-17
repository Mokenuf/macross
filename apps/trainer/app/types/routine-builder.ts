// createRoutineSchema solo lleva exerciseId; el builder guarda el ref del ejercicio para mostrar el nombre.

export interface BuilderExerciseRef {
  id: string
  nameEs: string
  nameEn: string | null
}

export interface BuilderExercise {
  id?: string
  exercise: BuilderExerciseRef | null
  sets: number
  reps: string
  restSeconds: number | null
  optional: boolean
  notes: string
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
