import { unitKindEnum, type UnitKind } from '@macross/shared'

export function useUnitOptions() {
  const { t } = useI18n()

  const kindLabels = computed<Record<UnitKind, string>>(() => ({
    count: t('units.kinds.count'),
    time: t('units.kinds.time'),
  }))

  const kindOptions = computed(() =>
    unitKindEnum.options.map(o => ({ label: kindLabels.value[o], value: o })),
  )

  return { kindLabels, kindOptions }
}
