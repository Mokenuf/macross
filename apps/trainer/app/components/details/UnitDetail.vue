<script setup lang="ts">
import { UnitKinds, type Unit } from '@macross/shared'

interface UnitDetailProps {
  unit: Unit
}

const { unit } = defineProps<UnitDetailProps>()
const { t } = useI18n()
const { kindLabels } = useUnitOptions()
</script>

<template>
  <div class="border-default bg-elevated space-y-3 rounded-lg border px-5 py-4">
    <div class="flex items-center gap-2">
      <BaseBadge :label="kindLabels[unit.kind]" color="primary" />
      <BaseBadge v-if="unit.isDefault" :label="t('units.default')" />
    </div>
    <p class="text-muted text-sm">
      {{ unit.kind === UnitKinds.time ? t('units.detail.time') : t('units.detail.count') }}
    </p>
    <p v-if="unit.isDefault" class="text-muted text-sm">{{ t('units.detail.default') }}</p>
    <p class="text-muted text-sm">{{ t('units.detail.usage', unit.exerciseCount ?? 0) }}</p>
  </div>
</template>
