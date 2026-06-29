import { clientGoalEnum, clientLevelEnum, type ClientGoal, type ClientLevel } from '@macross/shared'

export function useClientOptions() {
  const { t } = useI18n()

  const levelLabels = computed<Record<ClientLevel, string>>(() => ({
    beginner: t('clients.levels.beginner'),
    intermediate: t('clients.levels.intermediate'),
    advanced: t('clients.levels.advanced'),
    athlete: t('clients.levels.athlete'),
  }))

  const goalLabels = computed<Record<ClientGoal, string>>(() => ({
    hypertrophy: t('clients.goals.hypertrophy'),
    strength: t('clients.goals.strength'),
    fat_loss: t('clients.goals.fat_loss'),
    health: t('clients.goals.health'),
  }))

  const levelOptions = computed(() =>
    clientLevelEnum.options.map(o => ({ label: levelLabels.value[o], value: o })),
  )
  const goalOptions = computed(() =>
    clientGoalEnum.options.map(o => ({ label: goalLabels.value[o], value: o })),
  )

  return { levelLabels, goalLabels, levelOptions, goalOptions }
}
