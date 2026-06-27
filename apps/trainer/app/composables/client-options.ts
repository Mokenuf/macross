import { clientGoalEnum, clientLevelEnum, type ClientGoal, type ClientLevel } from '@macross/shared'

// Record tipado por el enum: si se agrega un valor al enum, TS exige el label acá
const levelLabels: Record<ClientLevel, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  athlete: 'Atleta',
}

const goalLabels: Record<ClientGoal, string> = {
  hypertrophy: 'Hipertrofia',
  strength: 'Fuerza',
  fat_loss: 'Bajar grasa',
  health: 'Salud',
}

export function useClientOptions() {
  const levelOptions = clientLevelEnum.options.map(o => ({ label: levelLabels[o], value: o }))
  const goalOptions = clientGoalEnum.options.map(o => ({ label: goalLabels[o], value: o }))

  return { levelLabels, goalLabels, levelOptions, goalOptions }
}
