import type { ExerciseWithPivot } from '@macross/shared'

export const toExercise = ({ exerciseMuscleGroups, ...rest }: ExerciseWithPivot) => ({
  ...rest,
  muscleGroups: exerciseMuscleGroups.map(emg => emg.muscleGroups),
})
